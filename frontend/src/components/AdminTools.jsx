import React, { useState } from 'react';
import { 
  Box, Heading, Text, Button, useToast, VStack, FormControl, FormLabel, Input, 
  Icon, Alert, AlertIcon, HStack, useDisclosure, AlertDialog, AlertDialogBody, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay 
} from '@chakra-ui/react';
import api from '../api';
import { FiUploadCloud, FiDownload, FiTrash2, FiUsers } from 'react-icons/fi';

const AdminTools = () => {
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Hooks de controle para os dois modais de confirmação
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  
  const cancelRef = React.useRef();
  const toast = useToast();

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) { toast({ title: 'Nenhum arquivo selecionado.', status: 'warning' }); return; }
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/admin/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({ title: 'Importação Concluída!', description: `${response.data.imported} importados. ${response.data.errors} erros.`, status: 'success', duration: 9000, isClosable: true });
    } catch (error) { 
      toast({ title: 'Erro na Importação.', description: error.response?.data?.message, status: 'error', duration: 9000, isClosable: true });
    } finally { 
      setIsImporting(false); 
      setFile(null); 
    }
  };

  const handleExport = async (status) => {
    setIsExporting(true);
    try {
      const response = await api.get(`/admin/export-links?status=${status}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contatos_${status}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) { 
      toast({ title: 'Erro ao gerar planilha.', description: 'Pode não haver participantes neste grupo.', status: 'error' });
    } finally { 
      setIsExporting(false); 
    }
  };
  
  const handleResetData = async () => {
    try {
      await api.post('/admin/reset-data', {});
      toast({ title: 'Dados Zerados!', description: 'Todos os participantes foram removidos.', status: 'success' });
      onResetClose();
      window.location.reload();
    } catch (error) { 
      toast({ title: 'Erro ao zerar dados.', status: 'error' });
    }
  };

  const handleAssignFamilies = async () => {
    setIsAssigning(true);
    onAssignClose();
    try {
      const response = await api.post('/admin/assign-families', {});
      toast({
        title: 'Sucesso!',
        description: response.data.message,
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao distribuir famílias.',
        description: error.response?.data?.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box p={6} bg="white" borderRadius="xl" boxShadow="lg">
        <Heading size="lg" mb={2} color="gray.700">Distribuição Automática de Famílias</Heading>
        <Text color="gray.500" mb={4}>Acione o algoritmo "Chapéu Seletor" para atribuir famílias a todos os participantes que ainda não possuem uma.</Text>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Esta ação é poderosa. Ela irá analisar todos os inscritos e definir as famílias de acordo com as regras de performance, idade e balanceamento.
        </Alert>
        <Button 
          mt={4} 
          colorScheme="purple" 
          onClick={onAssignOpen} 
          isLoading={isAssigning} 
          leftIcon={<Icon as={FiUsers} />}
        >
          Executar Distribuição de Famílias
        </Button>
      </Box>

      <Box p={6} bg="white" borderRadius="xl" boxShadow="lg">
        <Heading size="md">Importar Planilha de Inscritos</Heading>
        <Alert status="info" borderRadius="md" mt={4}>
          <AlertIcon />
          Envie o arquivo XLSX original exportado da plataforma de ingressos.
        </Alert>
        <FormControl mt={4}>
          <FormLabel>Arquivo XLSX</FormLabel>
          <Input 
            type="file" 
            p={1.5} 
            onChange={handleFileChange} 
            accept=".xlsx, .xls" 
            key={file ? file.name : 'empty'}
          />
        </FormControl>
        <Button 
          mt={4} 
          colorScheme="orange" 
          onClick={handleImport} 
          isLoading={isImporting} 
          isDisabled={!file} 
          leftIcon={<Icon as={FiUploadCloud} />}
        >
          Importar Planilha
        </Button>
      </Box>

      <Box p={6} bg="white" borderRadius="xl" boxShadow="lg">
        <Heading size="lg" mb={2} color="gray.700">Central de Exportação</Heading>
        <Text color="gray.500" mb={4}>Gere planilhas com links de WhatsApp para contato rápido.</Text>
        <HStack>
          <Button 
            colorScheme="yellow" 
            onClick={() => handleExport('pending')} 
            isLoading={isExporting} 
            leftIcon={<Icon as={FiDownload} />}
          >
            Baixar Contatos (Pendentes)
          </Button>
          <Button 
            colorScheme="green" 
            onClick={() => handleExport('complete')} 
            isLoading={isExporting} 
            leftIcon={<Icon as={FiDownload} />}
          >
            Baixar Contatos (Completos)
          </Button>
        </HStack>
      </Box>

      <Box p={6} bg="red.50" borderRadius="xl" borderWidth="1px" borderColor="red.200">
        <Heading size="md" color="red.700">Zona de Perigo</Heading>
        <Text color="red.600" mt={2}>A ação abaixo é irreversível e apagará todos os participantes.</Text>
        <Button mt={4} colorScheme="red" onClick={onResetOpen} leftIcon={<Icon as={FiTrash2} />}>
          Zerar Todos os Dados
        </Button>
      </Box>

      <AlertDialog isOpen={isAssignOpen} leastDestructiveRef={cancelRef} onClose={onAssignClose}>
        <AlertDialogOverlay><AlertDialogContent>
          <AlertDialogHeader>Confirmar Distribuição Automática</AlertDialogHeader>
          <AlertDialogBody>
            Você tem certeza? O sistema irá atribuir um número de família para todos os participantes não designados.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onAssignClose}>Cancelar</Button>
            <Button colorScheme="purple" onClick={handleAssignFamilies} ml={3}>Sim, Distribuir</Button>
          </AlertDialogFooter>
        </AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
      
      <AlertDialog isOpen={isResetOpen} leastDestructiveRef={cancelRef} onClose={onResetClose}>
        <AlertDialogOverlay><AlertDialogContent>
          <AlertDialogHeader>Confirmar Exclusão Total</AlertDialogHeader>
          <AlertDialogBody>
            Você tem certeza? Esta ação apagará **TODOS** os participantes, atestados e registros de check-in.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onResetClose}>Cancelar</Button>
            <Button colorScheme="red" onClick={handleResetData} ml={3}>Sim, Zerar Tudo</Button>
          </AlertDialogFooter>
        </AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
};

export default AdminTools;