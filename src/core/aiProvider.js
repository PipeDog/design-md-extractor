export function buildAiRequest(config, payload) {
  const url = `${config.baseUrl}${config.endpointPath}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey || ''}`,
  };

  const options = {
    method: 'POST',
    headers,
    body: JSON.stringify(
      config.protocol === 'chat_completions'
        ? buildChatCompletionsBody(config, payload)
        : buildResponsesBody(config, payload),
    ),
  };

  return { url, options };
}

function buildResponsesBody(config, payload) {
  return {
    model: config.model,
    temperature: config.temperature,
    max_output_tokens: config.maxOutputTokens,
    input: [
      {
        role: 'system',
        content: [{ type: 'input_text', text: payload.systemPrompt }],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `${payload.userPrompt}\n\n${JSON.stringify(
              { report: payload.report, snapshot: payload.snapshot },
              null,
              2,
            )}`,
          },
        ],
      },
    ],
  };
}

function buildChatCompletionsBody(config, payload) {
  return {
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxOutputTokens,
    messages: [
      {
        role: 'system',
        content: payload.systemPrompt,
      },
      {
        role: 'user',
        content: `${payload.userPrompt}\n\n${JSON.stringify(
          { report: payload.report, snapshot: payload.snapshot },
          null,
          2,
        )}`,
      },
    ],
  };
}

export function parseAiResponse(protocol, responseJson) {
  if (protocol === 'chat_completions') {
    return {
      markdown: responseJson?.choices?.[0]?.message?.content || '',
    };
  }

  const output = responseJson?.output || [];
  for (const item of output) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) {
        return { markdown: content.text };
      }
    }
  }

  return { markdown: '' };
}
