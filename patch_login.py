with open('/Users/drikshathakur/Desktop/Reservia/models/login.js', 'r') as f:
    content = f.read()

content = content.replace(
    'password: { type: String, required: true }',
    "password: { type: String, required: true },\n    role: { type: String, default: 'user' } // 'user' or 'admin'"
)

with open('/Users/drikshathakur/Desktop/Reservia/models/login.js', 'w') as f:
    f.write(content)
print("User model updated")
