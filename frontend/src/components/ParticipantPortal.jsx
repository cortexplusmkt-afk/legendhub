import React, { useEffect, useState } from 'react';
// A palavra 'Input' foi adicionada na linha abaixo
import { Box, Heading, Text, Button, useToast, Spinner, VStack, HStack, SimpleGrid, Textarea, RadioGroup, Radio, FormControl, FormLabel, Icon, Link, Input } from '@chakra-ui/react';
import axios from 'axios';
import api from '../api';
import { FiSave, FiUploadCloud, FiFileText, FiCheckCircle, FiAlertTriangle, FiDownload } from 'react-icons/fi';

const ParticipantPortal = ({ initialParticipantData, onUpdate }) => {
  const [participant, setParticipant] = useState(initialParticipantData);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const toast = useToast();
  
  useEffect(() => {
    setFormData({
      full_name: participant.full_name || '',
      email: participant.email || '',
      phone: participant.phone || '',
      birth_date: participant.birth_date ? new Date(participant.birth_date).toISOString().split('T')[0] : '',
      address: participant.address || '',
      profession: participant.profession || '',
      instagram: participant.instagram || '',
      church: participant.church || '',
      tshirt_size: participant.tshirt_size || '',
      weight: participant.weight || '',
      height: participant.height || '',
      physical_condition: participant.physical_condition || '',
      has_medical_condition: participant.has_medical_condition === null ? '' : String(participant.has_medical_condition),
      medical_condition_details: participant.medical_condition_details || '',
      uses_medication: participant.uses_medication === null ? '' : String(participant.uses_medication),
      medication_details: participant.medication_details || '',
      has_food_restriction: participant.has_food_restriction === null ? '' : String(participant.has_food_restriction),
      food_restriction_details: participant.food_restriction_details || '',
      companion_name: participant.companion_name || '',
      emergency_contact_name: participant.emergency_contact_name || '',
      emergency_contact_phone: participant.emergency_contact_phone || '',
      emergency_contact_email: participant.emergency_contact_email || '',
    });
  }, [participant]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleRadioChange = (name, value) => setFormData({ ...formData, [name]: value });

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    const dataToSend = {
      ...formData,
      has_medical_condition: formData.has_medical_condition === 'true',
      uses_medication: formData.uses_medication === 'true',
      has_food_restriction: formData.has_food_restriction === 'true',
    };

    try {
        const response = await api.put(`/participants/profile`, dataToSend);
        const updatedParticipant = response.data.participant;
        setParticipant(updatedParticipant);
        onUpdate(updatedParticipant);
        toast({ title: "Dados salvos com sucesso!", description: "Seu cadastro agora está completo.", status: "success" });
    } catch (error) {
        toast({ title: "Erro ao salvar dados.", description: error.response?.data?.message, status: "error" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (!file) {
      toast({ title: "Nenhum arquivo selecionado.", status: "warning" });
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      await api.post(`/participants/medical-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({ title: "Atestado enviado com sucesso!", status: "success" });
      const updatedParticipant = { ...participant, medical_document_status: 'submitted' };
      setParticipant(updatedParticipant);
      onUpdate(updatedParticipant);
    } catch (error) {
      toast({ title: "Erro no envio.", description: error.response?.data?.message, status: "error" });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <VStack spacing={6} align="stretch">
      <Box p={{ base: 4, md: 6 }} bg="white" borderRadius="xl" boxShadow="lg">
        <Heading size="lg" color="gray.700">Meu Portal, {participant.full_name ? participant.full_name.split(' ')[0] : ''}</Heading>
        <Text color="gray.500">Confirme seus dados e acesse os documentos do evento.</Text>
      </Box>

      <Box p={{ base: 4, md: 6 }} bg="white" borderRadius="xl" boxShadow="lg">
        <Heading size="md" mb={4} color="gray.700">Documentos Importantes</Heading>
        <HStack spacing={4} wrap="wrap">
          <Button as={Link} href="/documentos/O-que-levar.pdf" isExternal colorScheme="blue" leftIcon={<Icon as={FiDownload}/>}>
            O que Levar
          </Button>
          <Button as={Link} href="/documentos/Termo.pdf" isExternal colorScheme="blue" leftIcon={<Icon as={FiDownload}/>}>
            Termo de Responsabilidade
          </Button>
          <Button as={Link} href="/documentos/Atestado-Medico-1.pdf" isExternal colorScheme="blue" leftIcon={<Icon as={FiDownload}/>}>
            Modelo de Atestado
          </Button>
        </HStack>
      </Box>

      <Box p={{ base: 4, md: 6 }} bg="white" borderRadius="xl" boxShadow="lg">
        <Heading size="md" mb={4} color="gray.700">Dados Pessoais e Adicionais</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl><FormLabel>Nome Completo</FormLabel><Input name="full_name" value={formData.full_name} onChange={handleInputChange} /></FormControl>
            <FormControl><FormLabel>Email</FormLabel><Input name="email" type="email" value={formData.email} onChange={handleInputChange} /></FormControl>
            <FormControl><FormLabel>Telefone (WhatsApp)</FormLabel><Input name="phone" value={formData.phone} onChange={handleInputChange} /></FormControl>
            <FormControl><FormLabel>Data de Nascimento</FormLabel><Input name="birth_date" type="date" value={formData.birth_date} onChange={handleInputChange} /></FormControl>
            <FormControl gridColumn={{ base: 'span 1', md: 'span 2' }}><FormLabel>Endereço (Cidade, Estado)</FormLabel><Input name="address" value={formData.address} onChange={handleInputChange} /></FormControl>
            <FormControl><FormLabel>Profissão</FormLabel><Input name="profession" value={formData.profession} onChange={handleInputChange} /></FormControl>
            <FormControl><FormLabel>Instagram</FormLabel><Input name="instagram" value={formData.instagram} onChange={handleInputChange} /></FormControl>
            <FormControl><FormLabel>Igreja</FormLabel><Input name="church" value={formData.church} onChange={handleInputChange} /></FormControl>
            <FormControl><FormLabel>Tamanho da Camiseta</FormLabel><Input name="tshirt_size" value={formData.tshirt_size} onChange={handleInputChange} /></FormControl>
            <FormControl><FormLabel>Peso (kg)</FormLabel><Input name="weight" type="number" value={formData.weight} onChange={handleInputChange} /></FormControl>
            <FormControl><FormLabel>Altura (cm)</FormLabel><Input name="height" type="number" value={formData.height} onChange={handleInputChange} /></FormControl>
            <FormControl><FormLabel>Nome do Acompanhante (se houver)</FormLabel><Input name="companion_name" value={formData.companion_name} onChange={handleInputChange} /></FormControl>
        </SimpleGrid>
      </Box>

      <Box p={{ base: 4, md: 6 }} bg="white" borderRadius="xl" boxShadow="lg">
        <Heading size="md" mb={4} color="gray.700">Contatos de Emergência</Heading>
         <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl><FormLabel>Nome (Esposa/Contato)</FormLabel><Input name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleInputChange} /></FormControl>
            <FormControl><FormLabel>Telefone (WhatsApp)</FormLabel><Input name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleInputChange} /></FormControl>
            <FormControl gridColumn={{ base: 'span 1', md: 'span 2' }}><FormLabel>Email</FormLabel><Input name="emergency_contact_email" type="email" value={formData.emergency_contact_email} onChange={handleInputChange} /></FormControl>
        </SimpleGrid>
      </Box>

       <Box p={{ base: 4, md: 6 }} bg="white" borderRadius="xl" boxShadow="lg">
        <Heading size="md" mb={4} color="gray.700">Informações Médicas</Heading>
         <VStack spacing={4} align="stretch">
            <FormControl><FormLabel>Qual sua condição física (de 1 a 10)?</FormLabel><Input name="physical_condition" value={formData.physical_condition} onChange={handleInputChange} /></FormControl>
            <FormControl as="fieldset"><FormLabel as="legend">Possui alguma condição médica pré-existente?</FormLabel><RadioGroup onChange={(val) => handleRadioChange('has_medical_condition', val)} value={formData.has_medical_condition}><HStack><Radio value="true">Sim</Radio><Radio value="false">Não</Radio></HStack></RadioGroup></FormControl>
            {formData.has_medical_condition === 'true' && <FormControl><FormLabel>Se sim, detalhe:</FormLabel><Textarea name="medical_condition_details" value={formData.medical_condition_details} onChange={handleInputChange} /></FormControl>}
            <FormControl as="fieldset"><FormLabel as="legend">Faz uso de algum medicamento controlado?</FormLabel><RadioGroup onChange={(val) => handleRadioChange('uses_medication', val)} value={formData.uses_medication}><HStack><Radio value="true">Sim</Radio><Radio value="false">Não</Radio></HStack></RadioGroup></FormControl>
            {formData.uses_medication === 'true' && <FormControl><FormLabel>Detalhes do Medicamento</FormLabel><Textarea name="medication_details" value={formData.medication_details} onChange={handleInputChange} /></FormControl>}
            <FormControl as="fieldset"><FormLabel as="legend">Possui alguma restrição alimentar?</FormLabel><RadioGroup onChange={(val) => handleRadioChange('has_food_restriction', val)} value={formData.has_food_restriction}><HStack><Radio value="true">Sim</Radio><Radio value="false">Não</Radio></HStack></RadioGroup></FormControl>
            {formData.has_food_restriction === 'true' && <FormControl><FormLabel>Detalhes da Restrição</FormLabel><Textarea name="food_restriction_details" value={formData.food_restriction_details} onChange={handleInputChange} /></FormControl>}
        </VStack>
      </Box>

      <Button my={4} colorScheme="green" size="lg" onClick={handleProfileUpdate} isLoading={isLoading} leftIcon={<Icon as={FiSave} />}>
        Salvar e Concluir Meu Cadastro
      </Button>

      <Box p={{ base: 4, md: 6 }} bg="white" borderRadius="xl" boxShadow="lg" opacity={participant.profile_status !== 'complete' ? 0.4 : 1}>
        <Heading size="md" mb={4} color="gray.700">Atestado Médico</Heading>
        {participant.profile_status !== 'complete' ? (
            <Text color="gray.500">Preencha e salve seus dados acima para liberar o envio do atestado.</Text>
        ) : (
            <>
              {participant.medical_document_status === 'pending' && (
                <>
                  <FormControl>
                    <FormLabel>Selecione o arquivo (PDF)</FormLabel>
                    <Input type="file" p={1.5} onChange={(e) => setFile(e.target.files[0])} accept=".pdf" />
                  </FormControl>
                  <Button mt={4} colorScheme="blue" onClick={handleDocumentUpload} isLoading={isLoading} leftIcon={<Icon as={FiUploadCloud} />}>Enviar Documento</Button>
                </>
              )}
              {participant.medical_document_status === 'submitted' && <HStack><Icon as={FiFileText} color="blue.500" /><Text color="blue.500" fontWeight="bold">Seu atestado foi enviado e está aguardando análise.</Text></HStack>}
              {participant.medical_document_status === 'approved' && <HStack><Icon as={FiCheckCircle} color="green.500" /><Text color="green.500" fontWeight="bold">PARABÉNS! Atestado aprovado.</Text></HStack>}
              {participant.medical_document_status === 'rejected' && <HStack><Icon as={FiAlertTriangle} color="red.500" /><Text color="red.500" fontWeight="bold">Atestado reprovado. Contate a organização.</Text></HStack>}
            </>
        )}
      </Box>
    </VStack>
  );
};

export default ParticipantPortal;