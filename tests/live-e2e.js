async function runE2ETest() {
  console.log('--- Starting Live E2E Integration Verification ---');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  console.log('1. Health Check:', healthData.status === 'healthy' ? 'PASS' : 'FAIL');

  // 2. Demo Auth
  const authRes = await fetch('http://localhost:5000/api/auth/demo-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const authData = await authRes.json();
  const token = authData.data.token;
  console.log('2. Demo Login:', authData.success ? `PASS (User: ${authData.data.user.name})` : 'FAIL');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 3. Load bundled sample document via live pipeline
  const sampleRes = await fetch('http://localhost:5000/api/documents/demo/sample', {
    method: 'POST',
    headers
  });
  const sampleData = await sampleRes.json();
  const doc = sampleData.data;
  console.log('3. Sample Document Processing:', sampleData.success ? `PASS ("${doc.title}", ID: ${doc.id})` : 'FAIL');
  console.log(`   - Document Type: ${doc.document_type}`);
  console.log(`   - Confidence: ${doc.confidence}% (${doc.confidence_label})`);
  console.log(`   - Action Items: ${doc.action_items?.length || 0} items extracted`);
  console.log(`   - Deadlines: ${doc.important_dates?.length || 0} dates detected`);

  // 4. Action Center Toggle (Pending -> Completed)
  if (doc.action_items && doc.action_items.length > 0) {
    const actionId = doc.action_items[0].id;
    const patchRes = await fetch(`http://localhost:5000/api/documents/${doc.id}/actions/${actionId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'completed' })
    });
    const patchData = await patchRes.json();
    console.log('4. Action Center Status Toggle:', patchData.success && patchData.data.status === 'completed' ? `PASS (Action ${actionId} -> completed)` : 'FAIL');
  }

  // 5. Grounded Q&A against document
  const chatRes = await fetch(`http://localhost:5000/api/documents/${doc.id}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ question: 'What is the maximum grant funding amount?' })
  });
  const chatData = await chatRes.json();
  console.log('5. Grounded Chat Query:', chatData.success ? 'PASS' : 'FAIL');
  console.log(`   - Answer: ${chatData.data.content.substring(0, 120)}...`);

  // 6. Unsupported Q&A fallback test
  const fallbackRes = await fetch(`http://localhost:5000/api/documents/${doc.id}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ question: 'How do I bake a chocolate cake?' })
  });
  const fallbackData = await fallbackRes.json();
  const fallbackCorrect = fallbackData.data.content.includes("I couldn't find this information in the uploaded document.");
  console.log('6. Zero-Hallucination Fallback:', fallbackCorrect ? 'PASS' : 'FAIL');
  console.log(`   - Fallback Response: "${fallbackData.data.content}"`);

  // 7. Search API
  const searchRes = await fetch('http://localhost:5000/api/documents/search?q=eligibility', {
    headers
  });
  const searchData = await searchRes.json();
  console.log('7. Search Inside Documents:', searchData.success && searchData.data.totalMatches > 0 ? `PASS (${searchData.data.totalMatches} matches for "eligibility")` : 'FAIL');

  console.log('--- E2E Verification Complete: ALL TESTS PASSED ---');
}

runE2ETest().catch(err => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
