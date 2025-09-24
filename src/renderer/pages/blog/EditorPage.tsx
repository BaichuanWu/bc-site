import React, { useState } from 'react';
import { TextField, Paper, Box, Container } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const initialMarkdown = `
# Hello, Markdown!

This is a simple markdown editor with a live preview.

**Features:**
- Real-time preview
- Supports GitHub Flavored Markdown (GFM)

## GFM Example

| Feature | Support |
| ------- | ------- |
| Tables  | ✔       |
| Strikethrough | ~~like this~~ |

\`\`\`javascript
// Code blocks are also supported
function greet() {
  console.log("Hello, world!");
}
\`\`\`
`;

export default function EditorPage() {
  const [markdown, setMarkdown] = useState(initialMarkdown);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 128px)' }}>
        <Box sx={{ flex: 1, height: '100%' }}>
          <TextField
            label="Markdown"
            multiline
            fullWidth
            variant="outlined"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            sx={{ height: '100%', '& .MuiOutlinedInput-root': { height: '100%' } }}
          />
        </Box>
        <Box sx={{ flex: 1, height: '100%' }}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              height: '100%',
              overflowY: 'auto',
              border: '1px solid #ccc',
            }}
          >
            <Box sx={{ '.markdown-body': { p: 2 } }} className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}