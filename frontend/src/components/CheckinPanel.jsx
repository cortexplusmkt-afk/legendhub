import React, { useEffect, useState } from 'react';
import {
  Box, Heading, Button, useToast, Spinner, Text, VStack, HStack, Badge,
  Table, Thead, Tbody, Tr, Th, Td, ButtonGroup, Input, Popover, PopoverTrigger,
  PopoverContent, PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody,
  InputGroup, InputLeftElement, Icon, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  SimpleGrid, Wrap, WrapItem, Tag, Center, Textarea, RadioGroup, Radio, FormControl, FormLabel
} from '@chakra-ui/react';
import api from '../api'; // <<< USA NOSSO MENSAGEIRO OFICIAL
import { FiUserCheck, FiSearch, FiShield, FiUsers, FiSave } from 'react-icons/fi';

const CheckinPanel = () => { // O token não é mais recebido aqui
  const [allParticipants, setAllParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [familyNumber, setFamilyNumber] = useState('');
  const [familyCounts, setFamilyCounts] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const participantsPromise = api.get('/checkin/all');
      const familiesPromise = api.get('/checkin/family-counts');
      
      const [participantsResponse, familiesResponse] = await Promise.all([participantsPromise, familiesPromise]);
      
      setAllParticipants(participantsResponse.data);
      setFamilyCounts(familiesResponse.data);

    } catch (error) { 
      toast({ title: 'Erro ao carregar dados do painel.', status: 'error' }); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let result = allParticipants;
    if (filter === 'pending') { result = result.filter(p => !p.has_checked_in); } 
    else { result = result.filter(p => p.has_checked_in); }
    if (searchTerm) {
      result = result.filter(p => 
          (p.full_name && p.full_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
          (p.cpf && p.cpf.includes(searchTerm))
      );
    }
    setFilteredParticipants(result);
  }, [filter, searchTerm, allParticipants]);

  const handleUpdateFamily = async (participantId) => {
    if (!familyNumber) { toast({ title: "Número da família não pode ser vazio.", status: "warning" }); return; }
    try {
        await api.put(`/checkin/${participantId}/family`, { familyNumber: parseInt(familyNumber) });
        toast({ title: 'Família atualizada!', status: 'success' });
        setFamilyNumber('');
        fetchData();
    } catch(error) { toast({ title: 'Erro ao atualizar família.', status: 'error' }); }
  };

  const handleCheckin = async (participantId) => {
    try {
      const response = await api.post(`/checkin/${participantId}`, {});
      toast({ title: 'Check-in Realizado!', description: response.data.message, status: 'success' });
      fetchData();
    } catch (error) { toast({ title: 'Falha no Check-in!', description: error.response?.data?.message, status: 'error' }); }
  };

  const handleManualApprove = async (participantId) => {
    try {
      await api.post(`/medical/approve-manually/${participantId}`, {});
      toast({ title: 'Aprovação Manual Realizada!', status: 'success' });
      fetchData();
    } catch (error) { toast({ title: 'Falha na Aprovação!', description: error.response?.data?.message, status: 'error' }); }
  };

  const handleViewAndEdit = (participant) => {
    setSelectedParticipant(participant);
    setEditFormData({
        ...participant,
        birth_date: participant.birth_date ? new Date(participant.birth_date).toISOString().split('T')[0] : '',
        has_medical_condition: String(participant.has_medical_condition),
        uses_medication: String(participant.uses_medication),
        has_food_restriction: String(participant.has_food_restriction),
    });
    onOpen();
  };
  
  const handleModalInputChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  const handleModalRadioChange = (name, value) => setEditFormData({ ...editFormData, [name]: value });

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
        await api.put(`/checkin/${selectedParticipant.id}/edit`, editFormData);
        toast({ title: 'Dados atualizados!', status: 'success' });
        onClose();
        fetchData();
    } catch (error) {
        toast({ title: 'Erro ao salvar.', description: error.response?.data?.message, status: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
    return (<Center h="50vh"><Spinner size="xl" color="orange.500" /></Center>);
  }
  
  return (
    <>
      <Box p={6} bg="white" borderRadius="xl" boxShadow="lg">
        <Heading size="lg" mb={2} color="gray.700">Painel de Check-in</Heading>
        <Text color="gray.500" mb={6}>Gestão de entrada e famílias.</Text>

        <Box mb={6} p={4} bg="gray.50" borderRadius="md">
            <HStack mb={2}><Icon as={FiUsers} color="gray.600" /><Heading size="sm" color="gray.700">Contagem de Famílias</Heading></HStack>
            {familyCounts.length > 0 ? ( <Wrap>{familyCounts.map(family => (<WrapItem key={family.family_number}><Tag size="lg" variant="solid" colorScheme="orange">Família {family.family_number}: {family.member_count}</Tag></WrapItem>))}</Wrap>
            ) : (<Text fontSize="sm" color="gray.500">Nenhuma família foi definida ainda.</Text>)}
        </Box>

        <HStack mb={4} spacing={4}>
          <ButtonGroup isAttached variant="outline">
            <Button onClick={() => setFilter('pending')} isActive={filter === 'pending'}>Aguardando ({allParticipants.filter(p => !p.has_checked_in).length})</Button>
            <Button onClick={() => setFilter('done')} isActive={filter === 'done'}>Realizado ({allParticipants.filter(p => p.has_checked_in).length})</Button>
          </ButtonGroup>
          <InputGroup>
            <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color="gray.300" /></InputLeftElement>
            <Input placeholder="Buscar por nome ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} focusBorderColor="orange.400" />
          </InputGroup>
        </HStack>

        <Table variant="simple">
          <Thead><Tr><Th>Nome</Th><Th>Status</Th><Th>Família</Th><Th>Ações</Th></Tr></Thead>
          <Tbody>
            {filteredParticipants.map(p => {
              const isProfileComplete = p.profile_status === 'complete';
              const isMedicalApproved = p.medical_document_status === 'approved';
              const isReadyForCheckin = isProfileComplete && isMedicalApproved;

              return (
                <Tr key={p.id} _hover={{ bg: 'gray.50' }}>
                  <Td fontWeight="bold"><Button variant="link" colorScheme="orange" onClick={() => handleViewAndEdit(p)}>{p.full_name}</Button></Td>
                  <Td><VStack align="start" spacing={1}><Badge colorScheme={isProfileComplete ? 'green' : 'red'}>Dados Pessoais</Badge><Badge colorScheme={isMedicalApproved ? 'green' : 'red'}>Atestado Médico</Badge></VStack></Td>
                  <Td>
                    {p.family_number ? (
                      <Text fontWeight="bold" fontSize="lg">{p.family_number}</Text>
                    ) : (
                      <Popover placement="top-start">
                        <PopoverTrigger><Button size="xs" colorScheme="gray">Adicionar</Button></PopoverTrigger>
                        <PopoverContent>
                          <PopoverArrow /><PopoverCloseButton /><PopoverHeader>Definir Família</PopoverHeader>
                          <PopoverBody><HStack>
                              <Input type="number" onChange={(e) => setFamilyNumber(e.target.value)} placeholder="Nº" size="sm" />
                              <Button size="sm" colorScheme="green" onClick={() => handleUpdateFamily(p.id)}>Salvar</Button>
                          </HStack></PopoverBody>
                        </PopoverContent>
                      </Popover>
                    )}
                  </Td>
                  <Td>
                    <HStack>
                      <Button size="sm" colorScheme="green" isDisabled={!isReadyForCheckin || p.has_checked_in} onClick={() => handleCheckin(p.id)} leftIcon={<Icon as={FiUserCheck}/>}>{p.has_checked_in ? 'Realizado' : 'Check-in'}</Button>
                      {!isMedicalApproved && (<Popover><PopoverTrigger><Button size="sm" colorScheme="blue" leftIcon={<Icon as={FiShield}/>}>Aprovar Manual</Button></PopoverTrigger><PopoverContent><PopoverArrow /><PopoverCloseButton /><PopoverHeader>Confirmação</PopoverHeader><PopoverBody><Text>Aprovar o atestado de <strong>{p.full_name}</strong> manualmente?</Text><Button mt={4} w="full" colorScheme="blue" onClick={() => handleManualApprove(p.id)}>Sim, Aprovar</Button></PopoverBody></PopoverContent></Popover>)}
                    </HStack>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Dossiê: {selectedParticipant?.full_name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editFormData && (
              <VStack spacing={6} align="stretch">
                 <Box p={4} borderWidth={1} borderRadius="lg">
                    <Heading size="md" mb={4}>Dados Pessoais</Heading>
                    <SimpleGrid columns={3} spacing={4}>
                        <FormControl><FormLabel>Nome Completo</FormLabel><Input name="full_name" value={editFormData.full_name || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl><FormLabel>CPF</FormLabel><Input isReadOnly value={editFormData.cpf || ''} bg="gray.100" /></FormControl>
                        <FormControl><FormLabel>Email</FormLabel><Input name="email" type="email" value={editFormData.email || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl><FormLabel>Telefone (WhatsApp)</FormLabel><Input name="phone" value={editFormData.phone || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl><FormLabel>Data de Nascimento</FormLabel><Input name="birth_date" type="date" value={editFormData.birth_date || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl><FormLabel>Profissão</FormLabel><Input name="profession" value={editFormData.profession || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl gridColumn="span 3"><FormLabel>Endereço (Cidade, Estado)</FormLabel><Input name="address" value={editFormData.address || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl><FormLabel>Instagram</FormLabel><Input name="instagram" value={editFormData.instagram || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl><FormLabel>Igreja</FormLabel><Input name="church" value={editFormData.church || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl><FormLabel>Tamanho da Camiseta</FormLabel><Input name="tshirt_size" value={editFormData.tshirt_size || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl><FormLabel>Peso (kg)</FormLabel><Input name="weight" type="number" value={editFormData.weight || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl><FormLabel>Altura (cm)</FormLabel><Input name="height" type="number" value={editFormData.height || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl><FormLabel>Acompanhante (Nome)</FormLabel><Input name="companion_name" value={editFormData.companion_name || ''} onChange={handleModalInputChange} /></FormControl>
                    </SimpleGrid>
                 </Box>
                 <Box p={4} borderWidth={1} borderRadius="lg">
                    <Heading size="md" mb={4}>Contatos de Emergência</Heading>
                    <SimpleGrid columns={2} spacing={4}>
                        <FormControl><FormLabel>Nome (Esposa/Contato)</FormLabel><Input name="emergency_contact_name" value={editFormData.emergency_contact_name || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl><FormLabel>Telefone (WhatsApp)</FormLabel><Input name="emergency_contact_phone" value={editFormData.emergency_contact_phone || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl gridColumn="span 2"><FormLabel>Email</FormLabel><Input name="emergency_contact_email" type="email" value={editFormData.emergency_contact_email || ''} onChange={handleModalInputChange} /></FormControl>
                    </SimpleGrid>
                 </Box>
                 <Box p={4} borderWidth={1} borderRadius="lg">
                    <Heading size="md" mb={4}>Informações Médicas</Heading>
                    <VStack spacing={4} align="stretch">
                        <FormControl><FormLabel>Condição física (1 a 10)</FormLabel><Input name="physical_condition" value={editFormData.physical_condition || ''} onChange={handleModalInputChange} /></FormControl>
                        <FormControl as="fieldset"><FormLabel as="legend">Condição médica pré-existente?</FormLabel><RadioGroup onChange={(val) => handleModalRadioChange('has_medical_condition', val)} value={editFormData.has_medical_condition}><HStack><Radio value="true">Sim</Radio><Radio value="false">Não</Radio></HStack></RadioGroup></FormControl>
                        {editFormData.has_medical_condition === 'true' && <FormControl><FormLabel>Detalhes da Condição</FormLabel><Textarea name="medical_condition_details" value={editFormData.medical_condition_details || ''} onChange={handleModalInputChange} /></FormControl>}
                        <FormControl as="fieldset"><FormLabel as="legend">Usa medicamento controlado?</FormLabel><RadioGroup onChange={(val) => handleModalRadioChange('uses_medication', val)} value={editFormData.uses_medication}><HStack><Radio value="true">Sim</Radio><Radio value="false">Não</Radio></HStack></RadioGroup></FormControl>
                        {editFormData.uses_medication === 'true' && <FormControl><FormLabel>Detalhes do Medicamento</FormLabel><Textarea name="medication_details" value={editFormData.medication_details || ''} onChange={handleModalInputChange} /></FormControl>}
                        <FormControl as="fieldset"><FormLabel as="legend">Restrição alimentar?</FormLabel><RadioGroup onChange={(val) => handleModalRadioChange('has_food_restriction', val)} value={editFormData.has_food_restriction}><HStack><Radio value="true">Sim</Radio><Radio value="false">Não</Radio></HStack></RadioGroup></FormControl>
                        {editFormData.has_food_restriction === 'true' && <FormControl><FormLabel>Detalhes da Restrição</FormLabel><Textarea name="food_restriction_details" value={editFormData.food_restriction_details || ''} onChange={handleModalInputChange} /></FormControl>}
                    </VStack>
                 </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="green" onClick={handleSaveChanges} isLoading={isSaving} leftIcon={<Icon as={FiSave} />}>Salvar Alterações</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CheckinPanel;