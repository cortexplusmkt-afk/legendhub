import { Box, Flex, Heading, Button, Text } from '@chakra-ui/react';

// O Layout recebe os dados do usuário e a função de logout como "props"
// O 'children' é o conteúdo da página que será inserido dentro da moldura
const Layout = ({ user, onLogout, children }) => {
  return (
    <Box fontFamily="'Inter', sans-serif" bg="gray.50" minH="100vh">
      {/* Cabeçalho Fixo */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        p={4}
        bg="white"
        borderBottomWidth="1px"
        boxShadow="sm"
      >
        <Heading size="md" color="orange.500">LegendHub</Heading>
        <Flex align="center">
          <Text mr={4}>Olá, <strong>{user.name}</strong> ({user.role})</Text>
          <Button colorScheme="orange" variant="outline" size="sm" onClick={onLogout}>
            Sair
          </Button>
        </Flex>
      </Flex>

      {/* Conteúdo Principal da Página */}
      <Box as="main" p={8}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;