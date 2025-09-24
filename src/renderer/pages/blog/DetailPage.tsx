import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  ListItemAvatar,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Mock Data
const blogPost = {
  id: 1,
  title: 'Getting Started with React and MUI',
  content: `
This is the full content of the blog post.

It can contain multiple paragraphs, code blocks, and other markdown elements.

\`\`\`javascript
const greeting = "Hello, readers!";
console.log(greeting);
\`\`\`

Enjoy reading!
  `,
  comments: [
    { id: 1, author: 'Alice', text: 'Great article! Very helpful.' },
    { id: 2, author: 'Bob', text: 'Thanks for sharing this.' },
  ],
};

export default function DetailPage() {
  const { id } = useParams();

  // In a real app, you would fetch the post data based on the id
  // For now, we'll just use the mock data if the id is "1"
  if (id !== '1') {
    return (
      <Container>
        <Typography variant="h4">Post not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {blogPost.title}
        </Typography>
        <Box className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{blogPost.content}</ReactMarkdown>
        </Box>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Box>
        <Typography variant="h5" gutterBottom>
          Comments
        </Typography>
        <List>
          {blogPost.comments.map((comment, index) => (
            <React.Fragment key={comment.id}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar>{comment.author.charAt(0)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={comment.author}
                  secondary={comment.text}
                />
              </ListItem>
              {index < blogPost.comments.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Box>

      <Box component="form" sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Leave a Comment
        </Typography>
        <TextField
          label="Your Name"
          fullWidth
          margin="normal"
        />
        <TextField
          label="Your Comment"
          multiline
          rows={4}
          fullWidth
          margin="normal"
        />
        <Button variant="contained" type="submit" sx={{ mt: 2 }}>
          Submit Comment
        </Button>
      </Box>
    </Container>
  );
}