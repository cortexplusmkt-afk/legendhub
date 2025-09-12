import React, { useEffect, useState } from 'react';
import { Box, Heading, Button, useToast, Table, Thead, Tbody, Tr, Th, Td, Icon, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Select, VStack, HStack, Tag, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Text } from '@chakra-ui/react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../api'; // <<< USA NOSSO MENSAGEIRO OFICIAL

const UserManagementPanel = () => { // O token não é mais recebido aqui
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const cancelRef = React.useRef();

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'checkin' });
  const toast = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // A chamada agora é mais limpa, sem o objeto 'headers'
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      toast({ title: 'Erro ao carregar equipe.', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // O token não é mais uma dependência

  const handleInputChange = (e) => setNewUser({ ...newUser, [e.target.name]: e.target.value });

  const handleCreateUser = async () => {
    try {
      // A chamada agora é mais limpa, sem o objeto 'headers'
      await api.post('/admin/users', newUser);
      toast({ title: 'Usuário criado com sucesso!', status: 'success' });
      onClose();
      fetchUsers();
      setNewUser({ name: '', email: '', password: '', role: 'checkin' });
    } catch (error) {
      toast({ title: 'Erro ao criar usuário.', description: error.response?.data?.message, status: 'error' });
    }
  };

  const openDeleteAlert = (user) => {
    setUserToDelete(user);
    setIsAlertOpen(true);
  };
  
  const handleDeleteUser = async () => {
    try {
      // A chamada agora é mais limpa, sem o objeto 'headers'
      await api.delete(`/admin/users/${userToDelete.id}`);
      toast({ title: 'Usuário deletado!', status: 'warning' });
      setIsAlertOpen(false);
      fetchUsers();
    } catch (error) {
      toast({ title: 'Erro ao deletar.', status: 'error' });
    }
  };


  return (
    <>
      <Box p={6} bg="white" borderRadius="xl" boxShadow="lg">
        <HStack justify="space-between" mb={6}>
          <Box>
            <Heading size="lg" color="gray.700">Gerenciamento de Equipe</Heading>
            <Text color="gray.500">Adicione ou remova membros da equipe de service.</Text>
          </Box>
          <Button colorScheme="orange" leftIcon={<Icon as={FiPlus} />} onClick={onOpen}>
            Novo Service
          </Button>
        </HStack>
        <Table variant="simple">
          <Thead>
            <Tr><Th>Nome</Th><Th>Email</Th><Th>Função</Th><Th>Ação</Th></Tr>
          </Thead>
          <Tbody>
            {users.map(user => (
              <Tr key={user.id}>
                <Td fontWeight="bold">{user.name}</Td>
                <Td>{user.email}</Td>
                <Td><Tag colorScheme={
                    user.role === 'admin' ? 'red' : 
                    user.role === 'medical' ? 'blue' : 
                    user.role === 'checkin' ? 'purple' : 'pink'
                }>{user.role}</Tag></Td>

                <Td>
                  <IconButton
                    aria-label="Deletar usuário"
                    icon={<Icon as={FiTrash2} />}
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => openDeleteAlert(user)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Criar Novo Membro</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired><FormLabel>Nome Completo</FormLabel><Input name="name" onChange={handleInputChange} /></FormControl>
              <FormControl isRequired><FormLabel>Email</FormLabel><Input name="email" type="email" onChange={handleInputChange} /></FormControl>
              <FormControl isRequired><FormLabel>Senha Provisória</FormLabel><Input name="password" type="password" onChange={handleInputChange} /></FormControl>
              <FormControl isRequired>
                <FormLabel>Função</FormLabel>
                <Select name="role" onChange={handleInputChange} defaultValue="checkin">
                  <option value="checkin">Check-in</option>
                  <option value="medical">Médico</option>
                  <option value="admin">Admin</option>
                  <option value="lady">Lady</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="green" onClick={handleCreateUser}>Salvar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={() => setIsAlertOpen(false)}>
        <AlertDialogOverlay><AlertDialogContent>
          <AlertDialogHeader>Deletar Usuário</AlertDialogHeader>
          <AlertDialogBody>Tem certeza que quer deletar <strong>{userToDelete?.name}</strong>? Esta ação não pode ser desfeita.</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setIsAlertOpen(false)}>Cancelar</Button>
            <Button colorScheme="red" onClick={handleDeleteUser} ml={3}>Deletar</Button>
          </AlertDialogFooter>
        </AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default UserManagementPanel;