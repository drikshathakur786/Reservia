import re

with open('/Users/drikshathakur/Desktop/Reservia/views/includes/header.ejs', 'r') as f:
    content = f.read()

content = content.replace(
    'padding: 12px 28px;',
    'padding: 10px 24px;\n    height: fit-content;\n    align-self: center;'
)

with open('/Users/drikshathakur/Desktop/Reservia/views/includes/header.ejs', 'w') as f:
    f.write(content)
print("Button fixed")
