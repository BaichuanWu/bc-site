import React from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// Mock Data
const blogPosts = [
  {
    id: 1,
    title: 'Getting Started with React and MUI',
    excerpt: 'A comprehensive guide to building beautiful UIs with React and Material-UI...',
    date: 'August 28, 2025',
  },
  {
    id: 2,
    title: 'Advanced State Management with Zustand',
    excerpt: 'Learn how to manage complex state in your React applications with Zustand...',
    date: 'September 5, 2025',
  },
  {
    id: 3,
    title: 'Building a Markdown Editor',
    excerpt: 'A step-by-step tutorial on creating a live Markdown editor with React...',
    date: 'September 12, 2025',
  },
];

export default function ListPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Blog
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 4,
        }}
      >
        {blogPosts.map((post) => (
          <Card key={post.id}>
            <CardContent>
              <Typography gutterBottom variant="h5" component="h2">
                {post.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {post.date}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {post.excerpt}
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={RouterLink} to={`/blog/${post.id}`} size="small">
                Read More
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Container>
  );
}