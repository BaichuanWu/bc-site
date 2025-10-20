// import React from 'react';
// import {
//   Container,
//   Typography,
//   Box,
//   Button,
//   Card,
//   CardContent,
//   CardActions,
//   IconButton,
// } from '@mui/material';
// import { Link as RouterLink } from 'react-router-dom';
// import { GitHub, LinkedIn, Twitter } from '@mui/icons-material';

// const sections = [
//   {
//     title: 'Blog',
//     description: 'Read my thoughts on web development, quantitative finance, and more.',
//     path: '/blog',
//   },
//   {
//     title: 'Projects',
//     description: 'Explore a selection of my past and current projects.',
//     path: '/projects',
//   },
//   {
//     title: 'Quant Dashboard',
//     description: 'Access my personal dashboard for quantitative analysis.',
//     path: '/dashboard',
//   },
// ];

// export default function HomePage() {
//   return (
//     <Container maxWidth="lg">
//       {/* Hero Section */}
//       <Box
//         sx={{
//           textAlign: 'center',
//           my: 10,
//         }}
//       >
//         <Typography variant="h2" component="h1" gutterBottom>
//           Welcome to My Digital Space
//         </Typography>
//         <Typography variant="h5" color="text.secondary" paragraph>
//           I'm a passionate developer, exploring the worlds of web technology and finance.
//         </Typography>
//         <Button variant="contained" size="large" component={RouterLink} to="/projects">
//           View My Work
//         </Button>
//       </Box>

//       {/* Sections */}
//       <Box
//         sx={{
//           display: 'grid',
//           gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
//           gap: 4,
//           mb: 10,
//         }}
//       >
//         {sections.map((section) => (
//           <Card key={section.title}>
//             <CardContent>
//               <Typography gutterBottom variant="h5" component="h2">
//                 {section.title}
//               </Typography>
//               <Typography variant="body2" color="text.secondary">
//                 {section.description}
//               </Typography>
//             </CardContent>
//             <CardActions>
//               <Button component={RouterLink} to={section.path} size="small">
//                 Explore
//               </Button>
//             </CardActions>
//           </Card>
//         ))}
//       </Box>

//       {/* Social Links */}
//       <Box sx={{ textAlign: 'center', my: 5 }}>
//         <Typography variant="h6" gutterBottom>
//           Connect with me
//         </Typography>
//         <IconButton
//           aria-label="GitHub"
//           component="a"
//           href="https://github.com"
//           target="_blank"
//         >
//           <GitHub />
//         </IconButton>
//         <IconButton
//           aria-label="LinkedIn"
//           component="a"
//           href="https://linkedin.com"
//           target="_blank"
//         >
//           <LinkedIn />
//         </IconButton>
//         <IconButton
//           aria-label="Twitter"
//           component="a"
//           href="https://twitter.com"
//           target="_blank"
//         >
//           <Twitter />
//         </IconButton>
//       </Box>
//     </Container>
//   );
// }