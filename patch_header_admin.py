with open('/Users/drikshathakur/Desktop/Reservia/views/includes/header.ejs', 'r') as f:
    content = f.read()

# We insert the Dashboard link if admin
admin_link = """<% if (typeof userRole !== 'undefined' && userRole === 'admin') { %>
                                        <li class="navbar-item">
                                                <a href="/admin" class="navbar-link hover-underline" style="color: hsl(42, 48%, 77%);">Dashboard</a>
                                        </li>
                                <% } %>"""

content = content.replace(
    '<ul class="navbar-list">',
    f'<ul class="navbar-list">\n{admin_link}'
)

with open('/Users/drikshathakur/Desktop/Reservia/views/includes/header.ejs', 'w') as f:
    f.write(content)
print("Header patched for Admin link")
