import os
import re

favicon_svg = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L15.5 8.5L22 12L15.5 15.5L12 22L8.5 15.5L2 12L8.5 8.5L12 2Z" fill="%23c8a97e"/></svg>'
new_tag = f'<link rel="shortcut icon" href=\'{favicon_svg}\' type="image/svg+xml">'

for root, dirs, files in os.walk('/Users/drikshathakur/Desktop/Reservia/views'):
    for file in files:
        if file.endswith('.ejs'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Use regex to find any <link rel="icon"...> or <link rel="shortcut icon"...>
            # that we've used and replace it.
            # Example matches: 
            # <link rel="shortcut icon" href="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU5zQzIc0nbzV04ns-mz3q7PwWJUYHLyHyQA&s" type="image/x-icon">
            # <link rel = "icon" href = "<%=images[0]%>">
            
            content = re.sub(
                r'<link\s+rel\s*=\s*["\'](?:shortcut )?icon["\'][^>]*>',
                new_tag,
                content
            )
            
            with open(filepath, 'w') as f:
                f.write(content)
print("Favicons updated!")
