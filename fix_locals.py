with open('/Users/drikshathakur/Desktop/Reservia/server.js', 'r') as f:
    content = f.read()

content = content.replace(
    'res.locals.userId = req.session.userId || null;',
    'res.locals.userId = req.session.userId || null;\n    res.locals.userRole = req.session.role || null;'
)

with open('/Users/drikshathakur/Desktop/Reservia/server.js', 'w') as f:
    f.write(content)
print("Fixed locals middleware")
