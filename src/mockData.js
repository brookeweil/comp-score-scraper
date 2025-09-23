// Mock data for climbing competition scores

import { Climber, Climb, Division } from './models';

// Mock climber data
const mockClimberData = [
  { firstName: 'Alice', lastName: 'Johnson', gender: 'FEMALE', category: 'Advanced' },
  { firstName: 'Bob', lastName: 'Smith', gender: 'MALE', category: 'Advanced' },
  { firstName: 'Carol', lastName: 'Williams', gender: 'FEMALE', category: 'Intermediate' },
  { firstName: 'David', lastName: 'Brown', gender: 'MALE', category: 'Intermediate' },
  { firstName: 'Emma', lastName: 'Davis', gender: 'FEMALE', category: 'Advanced' },
  { firstName: 'Frank', lastName: 'Miller', gender: 'MALE', category: 'Beginner' },
  { firstName: 'Grace', lastName: 'Wilson', gender: 'FEMALE', category: 'Beginner' },
  { firstName: 'Henry', lastName: 'Moore', gender: 'MALE', category: 'Advanced' },
  { firstName: 'Isabella', lastName: 'Taylor', gender: 'FEMALE', category: 'Intermediate' },
  { firstName: 'Jack', lastName: 'Anderson', gender: 'MALE', category: 'Beginner' },
];

// Mock climb problems with varying difficulties
const mockProblems = [
    { name: 'Crimson Tide', value: 1000 },
    { name: 'Blue Steel', value: 900 },
    { name: 'Green Machine', value: 800 },
    { name: 'Purple Rain', value: 750 },
    { name: 'Orange Crush', value: 700 },
    { name: 'Yellow Submarine', value: 650 },
    { name: 'Pink Panther', value: 600 },
    { name: 'Black Diamond', value: 550 },
    { name: 'White Lightning', value: 500 },
    { name: 'Red Baron', value: 450 },
    { name: 'Silver Bullet', value: 400 },
    { name: 'Golden Eagle', value: 350 },
];

// Generate mock climbers with realistic climb attempts
export const generateMockData = () => {
    const mockClimbers = {};

    mockClimberData.forEach(climberData => {
        const climber = new Climber(
            climberData.firstName,
            climberData.lastName,
            climberData.gender,
            climberData.category
        );

        // Generate random climb attempts for each climber
        // Higher skill categories have better success rates
        const skillMultiplier = {
            'Advanced': 0.8,
            'Intermediate': 0.6,
            'Beginner': 0.4
        };

        const baseSuccessRate = skillMultiplier[climberData.category] || 0.5;

        mockProblems.forEach(problem => {
            // Success rate decreases with problem difficulty
            const difficultyFactor = Math.max(0.1, 1 - (problem.value - 350) / 1000);
            const successRate = baseSuccessRate * difficultyFactor;

            const sent = Math.random() < successRate;
            const onsight = sent && Math.random() < 0.3; // 30% chance of onsight if sent

            climber.climbs.push(new Climb(
                problem.name,
                problem.value,
                sent,
                onsight
            ));
        });

        mockClimbers[climber.fullName] = climber;
    });

    return mockClimbers;
};

// Generate mock divisions
export const generateMockDivisions = () => {
    return [
        new Division('FEMALE', 'Advanced'),
        new Division('MALE', 'Advanced'),
        new Division('FEMALE', 'Intermediate'),
        new Division('MALE', 'Intermediate'),
        new Division('FEMALE', 'Beginner'),
        new Division('MALE', 'Beginner'),
    ];
};