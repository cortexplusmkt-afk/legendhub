import React from 'react';
import { Box, Heading, Text, VStack, Spinner, Flex, HStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const teamNames = {
  medical: 'Equipe Hakuna',
  checkin: 'Equipe de Check-in',
  admin: 'Comando',
  lady: 'Lady',
};

const SplashScreen = ({ user, userType }) => { // Agora ele recebe o 'userType'
  const MotionBox = motion(Box);
  
  // MUDANÇA AQUI: Agora a lógica verifica o 'userType'
  const welcomeText = userType === 'participant'
    ? `Bem-vindo, ${user && user.full_name ? user.full_name.split(' ')[0] : ''}!`
    : `Bem-vindo, ${user ? teamNames[user.role] || 'Equipe' : 'Equipe'}`;

  return (
    <Flex 
      minH="100vh" 
      align="center" 
      justify="center" 
      bgGradient="linear(to-br, orange.400, gray.800)"
      color="white"
      fontFamily="'Inter', sans-serif"
    >
      <VStack spacing={6}>
        <MotionBox
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Heading size={{ base: '2xl', md: '3xl' }} textAlign="center">{welcomeText}</Heading>
        </MotionBox>
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <HStack>
            <Spinner color="white" />
            <Text fontSize="xl">Preparando seu painel...</Text>
          </HStack>
        </MotionBox>
      </VStack>
    </Flex>
  );
};

export default SplashScreen;