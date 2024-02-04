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
  onSubmit: (selectedOptions: SelectedOptions, selectedScores: OptionScores) => void;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({ onSubmit }) => {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  
  const handleOptionChange = (category: string, option: string) => {
    setSelectedOptions({ ...selectedOptions, [category]: option });
  };

  const handleSubmit = () => {
    const selectedScores: OptionScores = {};
    Object.entries(selectedOptions).forEach(([category, option]) => {
      selectedScores[category] = scores[option];
    });
    
    // Pass the selected options and scores back to the parent component
    onSubmit(selectedOptions, selectedScores);
  };
  
  return (
    <Box className="AssessmentForm-container">
      <Grid container spacing={2} justifyContent="center">
        {Object.entries(options).map(([category, optionsList]) => (
          <Grid item xs={12} key={category}>
            <Typography variant="h6" gutterBottom>
              {category}
            </Typography>
            <Box className="AssessmentForm-category">
              {optionsList.map(option => (
                <Box
                  key={option}
                  onClick={() => handleOptionChange(category, option)}
                  className={`AssessmentForm-option ${selectedOptions[category] === option ? 'selected' : ''}`}
                >
                  {`${option} (Score: ${scores[option]})`}
                </Box>
              ))}
            </Box>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleSubmit} fullWidth>
            Submit
          </Button>
        </Grid>
        <Grid item xs={12}>
          {Object.keys(selectedOptions).length > 0 && (
            <Paper elevation={2} className="AssessmentForm-paper">
              <List>
                {Object.entries(selectedOptions).map(([category, option]) => (
                  <ListItem key={category}>
                    {`${category}: ${option} (Score: ${scores[option]})`}
                  </ListItem>
                ))}
              </List>
              <Box className="AssessmentForm-totalScore">
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