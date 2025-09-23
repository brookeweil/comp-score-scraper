import React, { useState, useEffect, useCallback } from 'react';
import {
  ChakraProvider,
  defaultSystem,
  Box,
  Heading,
  Table,
  NativeSelect,
  VStack,
  Text,
  Spinner,
  Alert,
  Button,
  CloseButton,
} from '@chakra-ui/react';
import './App.css';
import { Climber, Climb, Result, Division, ONSIGHT_BONUS } from './models';
import { generateMockData, generateMockDivisions } from './mockData';

const SHOW_MOCK_DATA_BUTTON = false; // Set to true to allow mock data functionality (dev)

function App() {
  const [climbers, setClimbers] = useState({});
  const [allDivisions, setAllDivisions] = useState([]);
  const [filterGender, setFilterGender] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useMockData, setUseMockData] = useState(false);

  // Toggle between real and mock data
  const toggleMockData = () => {
    if (!useMockData) {
      // Switch to mock data
      const mockClimbers = generateMockData();
      setClimbers(mockClimbers);
      setAllDivisions(generateMockDivisions());
      setUseMockData(true);
      setError('');
    } else {
      // Switch back to real data
      setUseMockData(false);
      fetchData();
    }
  };

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://climbingcompscore.com/api/results');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const scoresData = await response.json();

      const climbersMap = {};

      for (const score of scoresData) {
        const climber = new Climber(
          score.climberFirstName,
          score.climberLastName,
          score.climber.gender,
          score.climber.category
        );

        if (climber.fullName in climbersMap) {
          continue; // already added
        }

        climbersMap[climber.fullName] = climber;

        for (const climb of score.climber.results) {
          climber.climbs.push(new Climb(
            climb.problem.name,
            climb.problem.value,
            climb.sent,
            climb.onsight
          ));
        }
      }

      setClimbers(climbersMap);

      // Get all divisions
      const divisionsSet = new Set();
      Object.values(climbersMap).forEach(climber => {
        divisionsSet.add(`${climber.gender}|${climber.category}`);
      });

      const divisions = Array.from(divisionsSet).map(divStr => {
        const [gender, category] = divStr.split('|');
        return new Division(gender, category);
      });

      setAllDivisions(divisions);
      setUseMockData(false);

    } catch (err) {
      setError(err.message);
      // Auto-switch to mock data if real data fails
      if (!useMockData) {
        const mockClimbers = generateMockData();
        setClimbers(mockClimbers);
        setAllDivisions(generateMockDivisions());
        setUseMockData(true);
        setError('Live data unavailable. Showing mock data instead.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate and filter results
  const calculateResults = useCallback(() => {
    const allResults = [];

    Object.values(climbers).forEach(climber => {
      const { totalScore, bestClimbs } = climber.totalScore(ONSIGHT_BONUS);
      const formattedScores = bestClimbs.map(climb =>
        climb.onsight ? `${climb.points}*` : `${climb.points}`
      );

      allResults.push(new Result(
        climber.fullName,
        Math.round(totalScore * 100) / 100,
        bestClimbs.length,
        climber.gender,
        climber.category,
        formattedScores.join(', ')
      ));
    });

    // Filter results based on selected filters
    let filteredResults = allResults;

    // Apply gender filter if selected
    if (filterGender) {
      filteredResults = filteredResults.filter(result =>
        result.gender === filterGender.toUpperCase()
      );
    }

    // Apply category filter if selected
    if (filterCategory) {
      filteredResults = filteredResults.filter(result =>
        result.category === `${filterCategory[0].toUpperCase()}${filterCategory.slice(1).toLowerCase()}`
      );
    }

    // Sort by score descending
    filteredResults.sort((a, b) => b.score - a.score);

    setResults(filteredResults);
  }, [climbers, filterGender, filterCategory]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    calculateResults();
  }, [calculateResults]);

  const uniqueGenders = [...new Set(allDivisions.map(d => d.gender))];
  const uniqueCategories = [...new Set(allDivisions.map(d => d.category))];

  return (
    <ChakraProvider value={defaultSystem}>
      <Box p={6} maxW="1200px" mx="auto">
        <VStack spacing={6} align="stretch">
          <Heading as="h1" size="xl" textAlign="center">
            Climbing Competition Scores
          </Heading>

          {error && (
            <Alert status="error">
              Error: {error}
            </Alert>
          )}

          <Box
            display={{ base: "flex", md: "flex" }}
            flexDirection={{ base: "column", md: "row" }}
            alignItems={{ base: "stretch", md: "center" }}
            justifyContent="center"
            gap={4}
            mb={2}
          >
            <Button
              onClick={fetchData}
              isLoading={loading}
              disabled={useMockData}
            >
              Refresh Data
            </Button>

            {SHOW_MOCK_DATA_BUTTON && (
              <Button onClick={toggleMockData} >
                {useMockData ? "Using Mock Data" : "Use Mock Data"}
              </Button>
            )}

            <Box position="relative" maxW="200px">
              <NativeSelect.Root>
                <NativeSelect.Field
                  placeholder="Select Gender"
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                >
                  {uniqueGenders.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
              {filterGender && (
                <CloseButton
                  position="absolute"
                  right="8px"
                  top="50%"
                  transform="translateY(-50%)"
                  size="sm"
                  onClick={() => setFilterGender('')}
                  aria-label="Clear gender filter"
                />
              )}
            </Box>

            <Box position="relative" maxW="200px">
              <NativeSelect.Root>
                <NativeSelect.Field
                  placeholder="Select Category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
              {filterCategory && (
                <CloseButton
                  position="absolute"
                  right="8px"
                  top="50%"
                  transform="translateY(-50%)"
                  size="sm"
                  onClick={() => setFilterCategory('')}
                  aria-label="Clear category filter"
                />
              )}
            </Box>

            {(filterGender || filterCategory) && (
              <Button
                onClick={() => {
                  setFilterGender('');
                  setFilterCategory('');
                }}
                variant="outline"
                size="sm"
              >
                Clear Filters
              </Button>
            )}
          </Box>

          {loading && (
            <Box textAlign="center">
              <Spinner size="lg" />
              <Text mt={2}>Loading competition data...</Text>
            </Box>
          )}

          {!loading && Object.keys(climbers).length === 0 && (
            <VStack spacing={4} textAlign="center" py={8}>
              <Text color="gray.500">
                No competition data available right now :(
              </Text>
              <Text fontSize="sm" color="orange.500">
                {SHOW_MOCK_DATA_BUTTON && "Click 'Use Mock Data' to see sample results"}
              </Text>
            </VStack>
          )}

          {!loading && Object.keys(climbers).length > 0 && (
            <>
              <VStack spacing={2}>
                <Heading as="h2" size="lg" textAlign="center">
                  {filterGender && filterCategory ?
                    `${filterGender} ${filterCategory} Results` :
                    filterGender ?
                      `${filterGender} Results` :
                      filterCategory ?
                        `${filterCategory} Results` :
                        'All Results'
                  }
                </Heading>
                {SHOW_MOCK_DATA_BUTTON && useMockData && (
                  <Text fontSize="sm" color="orange.500" textAlign="center">
                    📊 Displaying mock data for demonstration
                  </Text>
                )}
                {!filterGender && !filterCategory && (
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    Use filters above to narrow results by gender or category
                  </Text>
                )}
              </VStack>

              {results.length === 0 ? (
                <VStack spacing={3} textAlign="center" py={6}>
                  <Text fontSize="lg" color="gray.600">
                    🔍 No climbers found
                  </Text>
                  <Text color="gray.500">
                    {filterGender && filterCategory ?
                      `No results found for ${filterGender} ${filterCategory} division.` :
                      filterGender ?
                        `No results found for ${filterGender} climbers.` :
                        filterCategory ?
                          `No results found for ${filterCategory} category.` :
                          'No results found with current data.'
                    }
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    {filterGender || filterCategory ?
                      'Try adjusting your filters or clearing them to see all results.' :
                      'Try loading competition data or using mock data.'
                    }
                  </Text>
                </VStack>
              ) : (
                <Table.Root variant="simple" size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Rank</Table.ColumnHeader>
                      <Table.ColumnHeader>Climber Name</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Score</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Num Climbs</Table.ColumnHeader>
                      <Table.ColumnHeader>Scored Climbs</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {results.map((result, index) => (
                      <Table.Row key={result.climberName} _odd={{ bg: "blue.50" }}>
                        <Table.Cell fontWeight="bold">{index + 1}</Table.Cell>
                        <Table.Cell>{result.climberName}</Table.Cell>
                        <Table.Cell textAlign="end" fontWeight="bold">{result.score}</Table.Cell>
                        <Table.Cell textAlign="center">{result.numClimbs}</Table.Cell>
                        <Table.Cell maxWidth="100px">{result.scoredClimbs}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </>
          )}

          {!loading && allDivisions.length > 0 && (
            <Box>
              <Text fontSize="sm" color="gray.600">
                Available divisions: {allDivisions.map(d => d.toString()).join(', ')}
              </Text>
            </Box>
          )}
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;
