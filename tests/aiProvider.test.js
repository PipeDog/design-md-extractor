import test from 'node:test';
import assert from 'node:assert/strict';

import { buildAiRequest, parseAiResponse } from '../src/core/aiProvider.js';

const payloadFixture = {
  systemPrompt: '你是设计分析助手。',
  userPrompt: '请输出 DESIGN.md。',
  snapshot: {
    title: 'Acme',
    summary: '营销页面',
  },
};

test('buildAiRequest 支持 responses 协议', () => {
  const request = buildAiRequest(
    {
      baseUrl: 'https://api.example.com',
      endpointPath: '/v1/responses',
      model: 'gpt-5.2',
      protocol: 'responses',
      temperature: 0.2,
      maxOutputTokens: 3000,
    },
    payloadFixture,
  );

  assert.equal(request.url, 'https://api.example.com/v1/responses');
  assert.equal(request.options.method, 'POST');
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, 'gpt-5.2');
  assert.ok(Array.isArray(body.input));
});

test('buildAiRequest 支持 chat_completions 协议', () => {
  const request = buildAiRequest(
    {
      baseUrl: 'https://api.example.com',
      endpointPath: '/v1/chat/completions',
      model: 'gpt-4.1',
      protocol: 'chat_completions',
      temperature: 0.2,
      maxOutputTokens: 2500,
    },
    payloadFixture,
  );

  const body = JSON.parse(request.options.body);
  assert.equal(request.url, 'https://api.example.com/v1/chat/completions');
  assert.equal(body.model, 'gpt-4.1');
  assert.ok(Array.isArray(body.messages));
});

test('parseAiResponse 兼容 responses 协议输出', () => {
  const result = parseAiResponse('responses', {
    output: [
      {
        content: [
          {
            type: 'output_text',
            text: '# DESIGN.md\n\n内容',
          },
        ],
      },
    ],
  });

  assert.equal(result.markdown, '# DESIGN.md\n\n内容');
});

test('parseAiResponse 兼容 chat_completions 协议输出', () => {
  const result = parseAiResponse('chat_completions', {
    choices: [
      {
        message: {
          content: '# DESIGN.md\n\n内容',
        },
      },
    ],
  });

  assert.equal(result.markdown, '# DESIGN.md\n\n内容');
});
