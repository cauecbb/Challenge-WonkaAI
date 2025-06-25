import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Button, Image, Heading, Text, Flex, Box, Center } from '@chakra-ui/react';

const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
`;

const Logo = styled(Image)`
  height: 100px;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 2rem;
`;

const ContentBox = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  max-width: 800px;
  width: 100%;
  margin-bottom: 3rem;
`;

const StyledButton = styled(Button)`
  background-color: #0066cc;
  color: white;
  padding: 0.75rem 2rem;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #0055b3;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 102, 204, 0.2);
  }
`;

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  return (
    <PageContainer>
      <Center mt={10}>
        <Logo src="/wonka-logo.png" alt="Wonka Logo" />
      </Center>
        
      <MainContent>
        <ContentBox>
          <Flex direction="column" align="center" gap={6}>
            <Box textAlign="center" mb={6}>
              <Heading as="h3" size="lg" mb={4}>
                Welcome to Wonka Platform
              </Heading>
              <Text fontSize="lg" color="gray.600" maxWidth="600px">
                Our platform helps you manage quality improvements with smart solutions tailored to your needs.
              </Text>
            </Box>
            
            <StyledButton 
              onClick={handleGetStarted} 
              size="lg"
            >
              Get Started
            </StyledButton>
          </Flex>
        </ContentBox>
      </MainContent>
    </PageContainer>
  );
};

export default Landing;
