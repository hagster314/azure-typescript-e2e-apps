// AssessmentForm.tsx
import React, { useState } from 'react';
import { Button, Typography, Paper, Grid, List, ListItem, Box } from '@mui/material';
import './AssessmentForm.css';

// Define types for your options and scores for better type-checking
type OptionScores = Record<string, number>;
type Options = Record<string, string[]>;
type SelectedOptions = Record<string, string>;

const options: Options = {
  SensoryPerception: ["Completely limited", "Very limited", "Slightly limited", "No Impairment"],
  Moisture: ["Constantly moist", "Very moist", "Occasionally moist", "Rarely moist"],
  Activity: ["Bedfast", "Chairfast", "Walks occasionally", "Walks frequently"],
  Mobility: ["Completely immobile", "Very limited", "Slightly limited", "No limitations"],
  Nutrition: ["Very poor", "Probably inadequate", "Adequate", "Excellent"],
  FrictionAndShear: ["Problem", "Potential problem", "No apparent problem"]
};

const scores: OptionScores = {
  "Completely limited": 1,
  "Very limited": 2,
  "Slightly limited": 3,
  "No Impairment": 4,
  "Constantly moist": 1,
  "Very moist": 2,
  "Occasionally moist": 3,
  "Rarely moist": 4,
  "Bedfast": 1,
  "Chairfast": 2,
  "Walks occasionally": 3,
  "Walks frequently": 4,
  "Completely immobile": 1,
  "No limitations": 4,
  "Very poor": 1,
  "Probably inadequate": 2,
  "Adequate": 3,
  "Excellent": 4,
  "Problem": 1,
  "Potential problem": 2,
  "No apparent problem": 3
};

interface AssessmentFormProps {
  onSubmit: (selectedOptions: SelectedOptions, selectedScores: OptionScores, totalScore: number) => void;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({ onSubmit }) => {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  
  const handleOptionChange = (category: string, option: string) => {
    setSelectedOptions({ ...selectedOptions, [category]: option });
  };

  const handleSubmit = () => {
    const selectedScores: OptionScores = {};
    let totalScore = 0;
    Object.entries(selectedOptions).forEach(([category, option]) => {
      selectedScores[category] = scores[option];
      totalScore += scores[option];
    });
    
    // Pass the selected options, scores, and total score back to the parent component
    onSubmit(selectedOptions, selectedScores, totalScore);
  };
  
  return (
    <Box sx={{ width: '100%', maxWidth: '600px', my: 4, mx: 'auto' }}>
  <Grid container spacing={2} justifyContent="center">
    {Object.entries(options).map(([category, optionsList]) => (
      <Grid item xs={12} key={category}>
        <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          {category.replace(/([A-Z])/g, ' $1').trim()} {/* Adds space before capital letters for readability */}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {optionsList.map(option => (
            <Box
              key={option}
              sx={{
                cursor: 'pointer',
                borderRadius: '5px',
                border: `1px solid ${selectedOptions[category] === option ? '#607d8b' : '#ccc'}`,
                bgcolor: selectedOptions[category] === option ? '#607d8b' : '',
                color: selectedOptions[category] === option ? '#fff' : '',
                p: 1,
                m: 1,
                '&:hover': {
                  borderColor: '#607d8b',
                },
              }}
              onClick={() => handleOptionChange(category, option)}
            >
              {option}
            </Box>
          ))}
        </Box>
      </Grid>
    ))}
    <Grid item xs={12}>
    <Button variant="contained" sx={{ bgcolor: '#00ACC1', '&:hover': { bgcolor: '#0097A7' }, mt: 2 }} onClick={handleSubmit} fullWidth>
    Submit
    </Button>
    </Grid>
    <Grid item xs={12}>
      {Object.keys(selectedOptions).length > 0 && (
        <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
          <List>
            {Object.entries(selectedOptions).map(([category, option]) => (
              <ListItem key={category}>
                {`${category}: ${option} (Score: ${scores[option]})`}
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="h5" component="p">
              Total Score: {Object.values(selectedOptions).reduce((total, current) => total + scores[current], 0)}
            </Typography>
          </Box>
        </Paper>
      )}
    </Grid>
  </Grid>
</Box>
  );
};

export default AssessmentForm;
export type { SelectedOptions, OptionScores };