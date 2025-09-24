import React from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Box,
} from '@mui/material';

// Mock Data
const projects = [
  {
    id: 1,
    title: 'E-commerce Website',
    description: 'A full-featured e-commerce site built with React, Node.js, and MongoDB. Includes product catalog, shopping cart, and payment integration.',
    imageUrl: 'https://source.unsplash.com/random/800x600?ecommerce',
  },
  {
    id: 2,
    title: 'Task Management App',
    description: 'A collaborative task management tool that helps teams organize their work. Built with Vue.js and Firebase.',
    imageUrl: 'https://source.unsplash.com/random/800x600?task',
  },
  {
    id: 3,
    title: 'Personal Portfolio',
    description: 'The very website you are looking at now! Designed to showcase my skills and projects.',
    imageUrl: 'https://source.unsplash.com/random/800x600?portfolio',
  },
];

export default function ProjectsPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Projects
        </Typography>
        <Typography variant="body1">
          Here are some of the projects I've worked on.
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 4,
        }}
      >
        {projects.map((project) => (
          <Card key={project.id}>
            <CardMedia
              component="img"
              height="140"
              image={project.imageUrl}
              alt={project.title}
            />
            <CardContent>
              <Typography gutterBottom variant="h5" component="h2">
                {project.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {project.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
}