INSERT INTO permission(code, description) VALUES
  ('operations:read','View operational administration'),
  ('community:write','Manage community impact'),
  ('governance:write','Manage risks and recommendations'),
  ('settings:read','View organization settings and audit'),
  ('settings:write','Manage organization settings'),
  ('users:read','View organization users'),
  ('users:write','Manage organization users')
ON CONFLICT DO NOTHING;
