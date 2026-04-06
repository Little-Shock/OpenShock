import http from 'node:http';
import { once } from 'node:events';
import { ServerCoordinator } from './src/coordinator.js';
import { createHttpServer } from './src/http-server.js';

async function requestJson({ port, method, path, body }) {
  const payload = body === undefined ? null : JSON.stringify(body);
  return await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      method,
      path,
      headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ statusCode: res.statusCode, body: text ? JSON.parse(text) : null });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const coordinator = new ServerCoordinator({ escalationMs: 10_000 });
  const server = createHttpServer(coordinator, {});
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('bind failed');
  const port = address.port;

  try {
    const seeded = await requestJson({ port, method: 'POST', path: '/runtime/fixtures/seed', body: {} });
    if (seeded.statusCode !== 200) throw new Error(`seed=${seeded.statusCode}`);

    const repoBinding = await requestJson({
      port,
      method: 'PUT',
      path: '/v1/topics/topic_v1_batch5_integration/repo-binding',
      body: {
        provider_ref: { provider: 'github', repo_ref: 'little-shock/openshockswarm' },
        default_branch: 'main',
        bound_by: 'lead_sample_01'
      }
    });
    if (repoBinding.statusCode !== 200) throw new Error(`repoBinding=${repoBinding.statusCode}`);

    const handoff = await requestJson({
      port,
      method: 'POST',
      path: '/topics/topic_v1_batch5_integration/messages',
      body: {
        type: 'handoff_package',
        sourceAgentId: 'worker_sample_01',
        sourceRole: 'worker',
        targetScope: 'lead',
        runId: 'run_batch5_01',
        laneId: 'lane_sample_01',
        referencedArtifacts: ['artifact://batch5-handoff'],
        payload: { summary: 'batch5 handoff ready' }
      }
    });
    if (handoff.statusCode !== 200) throw new Error(`handoff=${handoff.statusCode}`);

    const ack = await requestJson({
      port,
      method: 'POST',
      path: '/topics/topic_v1_batch5_integration/messages',
      body: {
        type: 'status_report',
        sourceAgentId: 'lead_sample_01',
        sourceRole: 'lead',
        runId: 'run_batch5_01',
        payload: {
          event: 'handoff_ack',
          handoffId: handoff.body.messageId,
          resolvedArtifacts: ['artifact://batch5-handoff']
        }
      }
    });
    if (ack.statusCode !== 200) throw new Error(`ack=${ack.statusCode}`);

    const merge = await requestJson({
      port,
      method: 'POST',
      path: '/topics/topic_v1_batch5_integration/messages',
      body: {
        type: 'merge_request',
        sourceAgentId: 'worker_sample_01',
        sourceRole: 'worker',
        runId: 'run_batch5_01',
        laneId: 'lane_sample_01',
        payload: {
          handoffId: handoff.body.messageId,
          prUrl: 'https://github.com/little-shock/openshockswarm/pull/205',
          provider_ref: { provider: 'github', repo_ref: 'little-shock/openshockswarm', pr_number: 205 },
          base_branch: 'main',
          checkpoint_id: 'checkpoint://batch5-delivery',
          artifact_refs: ['artifact://batch5-delivery']
        }
      }
    });
    if (merge.statusCode !== 200) throw new Error(`merge=${merge.statusCode}`);

    const feedback = await requestJson({
      port,
      method: 'POST',
      path: '/runtime/daemon/events',
      body: {
        topicId: 'topic_v1_batch5_integration',
        type: 'feedback_ingest',
        runId: 'run_batch5_01',
        laneId: 'lane_sample_01',
        payload: {
          feedbackId: 'feedback_batch5_01',
          summary: 'batch5 delivery lineage evidence',
          trace_id: 'trace_batch5_01',
          checkpoint_id: 'checkpoint://batch5-feedback',
          artifact_refs: ['artifact://batch5-feedback']
        }
      }
    });
    if (feedback.statusCode !== 200) throw new Error(`feedback=${feedback.statusCode}`);

    const createdPr = await requestJson({
      port,
      method: 'POST',
      path: '/v1/topics/topic_v1_batch5_integration/prs',
      body: {
        provider_ref: { provider: 'github', repo_ref: 'little-shock/openshockswarm', pr_number: 205 },
        title: 'batch5 delivery closeout projection',
        url: 'https://github.com/little-shock/openshockswarm/pull/205'
      }
    });
    if (createdPr.statusCode !== 201) throw new Error(`createPr=${createdPr.statusCode}`);

    const prList = await requestJson({ port, method: 'GET', path: '/v1/topics/topic_v1_batch5_integration/prs' });
    const prDetail = await requestJson({ port, method: 'GET', path: `/v1/prs/${encodeURIComponent(createdPr.body.pr_id)}` });
    const repoBindingRead = await requestJson({ port, method: 'GET', path: '/v1/topics/topic_v1_batch5_integration/repo-binding' });
    const notifications = await requestJson({ port, method: 'GET', path: '/v1/topics/topic_v1_batch5_integration/notifications?limit=20' });
    const compatibility = await requestJson({ port, method: 'GET', path: '/v1/compatibility/shell-adapter?topic_id=topic_v1_batch5_integration' });
    const missingPr = await requestJson({ port, method: 'GET', path: '/v1/prs/pr_missing_batch5' });

    for (const [name, res] of Object.entries({ prList, prDetail, repoBindingRead, notifications, compatibility })) {
      if (res.statusCode !== 200) throw new Error(`${name}=${res.statusCode}`);
    }
    if (missingPr.statusCode !== 404) throw new Error(`missingPr=${missingPr.statusCode}`);

    const runIds = {
      pr_list: prList.body.delivery_projection.pr_writeback_ref.run_id,
      pr_detail: prDetail.body.delivery_projection.pr_writeback_ref.run_id,
      repo_binding: repoBindingRead.body.delivery_projection.pr_writeback_ref.run_id,
      notifications: notifications.body.delivery_projection.pr_writeback_ref.run_id,
      compatibility: compatibility.body.backend_derived_projection.delivery_projection.pr_writeback_ref.run_id
    };
    const uniqueRunIds = [...new Set(Object.values(runIds))];
    if (uniqueRunIds.length !== 1 || uniqueRunIds[0] !== 'run_batch5_01') throw new Error(`runIds=${JSON.stringify(runIds)}`);

    if (!prList.body.delivery_projection.delivery_ready_lineage.checkpoint_refs.includes('checkpoint://batch5-feedback')) {
      throw new Error('missing delivery_ready checkpoint ref');
    }
    if (!prList.body.delivery_projection.delivery_ready_lineage.artifact_refs.includes('artifact://batch5-handoff')) {
      throw new Error('missing delivery_ready artifact ref');
    }

    const publicJson = JSON.stringify({ prList: prList.body, prDetail: prDetail.body, repoBindingRead: repoBindingRead.body, notifications: notifications.body, compatibility: compatibility.body });
    if (publicJson.includes('/tmp/') || publicJson.includes('local_path')) throw new Error('public surface leaked local path');

    console.log(JSON.stringify({
      verdict: 'PASS',
      checks: {
        shared_run_id: uniqueRunIds[0],
        pr_url: prDetail.body.delivery_projection.pr_writeback_ref.pr_url,
        merge_lifecycle_state: prList.body.delivery_projection.merge_lifecycle_state,
        delivery_ready_checkpoint_ref: prList.body.delivery_projection.delivery_ready_lineage.checkpoint_refs[0],
        compatibility_surfaces: compatibility.body.backend_derived_projection.projection_surfaces,
        missing_pr_status: missingPr.statusCode
      }
    }, null, 2));
  } finally {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
