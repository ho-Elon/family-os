export default async function handler(req, res) {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  const keyLen = process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0;
  return res.status(200).json({
    ok: true,
    has_api_key: hasKey,
    key_length: keyLen,
    node_version: process.version,
    method: req.method
  });
}
