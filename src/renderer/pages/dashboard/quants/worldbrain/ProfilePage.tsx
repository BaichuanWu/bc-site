import * as React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Container,
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Corrected import

// Mock Data
const userProfile = {
  name: 'Quant Master',
  id: 'QM12345',
  overallScore: 85,
  alphaQualityScore: 90,
  regionalScores: [
    { region: 'USA', score: 88 },
    { region: 'EUROPE', score: 82 },
    { region: 'ASIA', score: 78 },
  ],
  alphaTypes: [
    { type: 'Momentum', count: 15, performance: 'Good' },
    { type: 'Value', count: 10, performance: 'Average' },
    { type: 'Growth', count: 5, performance: 'Excellent' },
  ],
};

const improvementSuggestions = [
  'Focus on developing more "Value" type alphas in the ASIA region to improve score diversification.',
  'Explore datasets related to macroeconomic indicators for the EUROPE region.',
  'Increase the complexity of your alpha expressions to potentially unlock higher scores.',
  'Participate in the upcoming "Global Quant Challenge" to benchmark your skills.',
];

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1">{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" value={value} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{`${value}%`}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function ProfilePage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* User Profile Card */}
        <Grid>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                {userProfile.name}
              </Typography>
              <Typography sx={{ mb: 1.5 }} color="text.secondary">
                ID: {userProfile.id}
              </Typography>
              <ScoreBar label="Overall Score" value={userProfile.overallScore} />
              <ScoreBar label="Alpha Quality" value={userProfile.alphaQualityScore} />
            </CardContent>
          </Card>
        </Grid>

        {/* Regional Scores Card */}
        <Grid >
          <Card>
            <CardContent>
              <Typography variant="h6">Regional Alpha Scores</Typography>
              <List>
                {userProfile.regionalScores.map((item) => (
                  <ListItem key={item.region} disableGutters>
                    <ListItemText primary={item.region} />
                    <Chip label={`${item.score}`} color="primary" />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Alpha Types Distribution */}
        <Grid >
          <Card>
            <CardContent>
              <Typography variant="h6">Alpha Type Distribution</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                {userProfile.alphaTypes.map((alpha) => (
                  <Chip
                    key={alpha.type}
                    label={`${alpha.type}: ${alpha.count} (${alpha.performance})`}
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Improvement Suggestions */}
        <Grid >
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Improvement Suggestions
            </Typography>
            <List>
              {improvementSuggestions.map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemText primary={suggestion} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}