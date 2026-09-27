with open('/Users/drikshathakur/Desktop/Reservia/server.js', 'r') as f:
    content = f.read()

# Modify the POST /login route to store role in session
# We look for `req.session.userId = user._id;`
# and add `req.session.role = user.role;`

content = content.replace(
    'req.session.userName = user.name;',
    'req.session.userName = user.name;\n        req.session.role = user.role;'
)

# And in the middleware that exposes locals:
content = content.replace(
    'res.locals.userId = req.session.userId;',
    'res.locals.userId = req.session.userId;\n    res.locals.userRole = req.session.role;'
)

with open('/Users/drikshathakur/Desktop/Reservia/server.js', 'w') as f:
    f.write(content)
print("Login route patched for role")
