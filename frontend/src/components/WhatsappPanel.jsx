import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, VStack, Spinner, Center, Tag, HStack, Icon, Textarea, Button, useToast, Progress, List, ListItem, ListIcon } from '@chakra-ui/react';
import { io } from 'socket.io-client';
import QRCode from 'react-qr-code';
import { FiWifi, FiWifiOff, FiCheckCircle, FiMessageSquare, FiSend, FiXCircle } from 'react-icons/fi';
import api from '../api';

const socket = io('https://legendhub.cortexplus.com.br', {
  path: '/socket.io',
});

const WhatsappPanel = () => {
  const [status, setStatus] = useState('Conectando...');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  const [message, setMessage] = useState(
    'Olá, {nome}! Verificamos que seu cadastro para o Legendários está pendente. Por favor, acesse o portal para completar seus dados e garantir sua participação!\n\n' +
    'Acesse: https://legendhub.cortexplus.com.br\n\n' +
    'Para entrar, use seu CPF e o mesmo e-mail que você usou na inscrição. Te vemos lá!'
  );
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const [progressLog, setProgressLog] = useState([]);

  const toast = useToast();

  useEffect(() => {
    socket.on('whatsapp_status', (newStatus) => setStatus(newStatus));
    socket.on('whatsapp_qr', (url) => {
      setStatus('Aguardando QR Code');
      setQrCodeUrl(url);
    });
    socket.on('whatsapp_ready', () => {
      setStatus('Conectado');
      setQrCodeUrl('');
    });
    socket.on('whatsapp_disconnected', () => setStatus('Desconectado'));

    socket.on('whatsapp_progress', (data) => {
      setProgress({ sent: data.sent, total: data.total });
      const logEntry = {
        name: data.currentName,
        success: data.success,
      };
      // Adiciona o novo log no topo, mantendo os últimos 5
      setProgressLog(prevLog => [logEntry, ...prevLog].slice(0, 5));
    });
    
    socket.on('whatsapp_finished', (data) => {
        setIsSending(false);
        toast({
            title: 'Disparo Finalizado!',
            description: `${data.sent} de ${data.total} mensagens enviadas com sucesso.`,
            status: 'success',
            duration: 9000,
            isClosable: true,
        });
    });

    // Limpa os listeners quando o componente é desmontado para evitar duplicação
    return () => {
      socket.off('whatsapp_status');
      socket.off('whatsapp_qr');
      socket.off('whatsapp_ready');
      socket.off('whatsapp_disconnected');
      socket.off('whatsapp_progress');
      socket.off('whatsapp_finished');
    };
  }, []);

  const handleSend = async (participantStatus) => {
    setIsSending(true);
    setProgress({ sent: 0, total: 0 });
    setProgressLog([]);
    try {
        const response = await api.post('/admin/send-whatsapp', { status: participantStatus, message });
        toast({ title: 'Ordem de Disparo Recebida!', description: response.data.message, status: 'info', duration: 5000, isClosable: true });
    } catch (error) {
        toast({ title: 'Erro ao iniciar disparo.', description: error.response?.data?.message, status: 'error', duration: 9000, isClosable: true });
        setIsSending(false);
    }
  };

  const StatusIndicator = () => {
    const isConnected = status === 'Conectado';
    return (
        <Tag size="lg" colorScheme={isConnected ? 'green' : 'red'} variant="solid">
            <HStack>
                <Icon as={isConnected ? FiWifi : FiWifiOff} />
                <Text>Status: {status}</Text>
            </HStack>
        </Tag>
    );
  };

  return (
    <Box p={6} bg="white" borderRadius="xl" boxShadow="lg">
      <HStack justify="space-between" mb={6}>
        <Box>
            <Heading size="lg" color="gray.700">Automação de WhatsApp</Heading>
            <Text color="gray.500">Conecte seu aparelho e gerencie os disparos.</Text>
        </Box>
        <StatusIndicator />
      </HStack>
      
      {status !== 'Conectado' ? (
        <Center p={10} bg="gray.50" borderRadius="md" minH="400px">
          {status === 'Aguardando QR Code' && qrCodeUrl ? (
            <VStack spacing={4}>
              <Heading size="md">Escaneie para Conectar</Heading>
              <Text>Abra o WhatsApp, vá em "Aparelhos Conectados" e aponte a câmera.</Text>
              <Box p={4} bg="white" borderRadius="lg" boxShadow="md">
                <QRCode value={qrCodeUrl} size={256} />
              </Box>
            </VStack>
          ) : (
            <VStack spacing={4}>
                <Spinner size="xl" color="orange.500" />
                <Text color="gray.500">{status}...</Text>
            </VStack>
          )}
        </Center>
      ) : (
        <VStack spacing={6} align="stretch">
            <VStack spacing={4} align="stretch" p={6} borderWidth={1} borderRadius="lg" borderColor="gray.200">
                <Heading size="md">1. Mensagem</Heading>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} focusBorderColor="orange.400" isDisabled={isSending}/>
                <Text fontSize="xs" color="gray.500">Use <strong>{`{nome}`}</strong> para inserir o primeiro nome do participante.</Text>
                <Heading size="md" mt={4}>2. Disparar Para:</Heading>
                <HStack>
                    <Button colorScheme="yellow" onClick={() => handleSend('pending')} isLoading={isSending} leftIcon={<Icon as={FiSend} />}>
                      Participantes Pendentes
                    </Button>
                    <Button colorScheme="green" onClick={() => handleSend('complete')} isLoading={isSending} leftIcon={<Icon as={FiSend} />}>
                      Participantes Completos
                    </Button>
                </HStack>
            </VStack>
            {isSending && (
                <VStack spacing={4} align="stretch" p={6} borderWidth={1} borderRadius="lg" borderColor="gray.200">
                    <Heading size="md">Progresso do Envio</Heading>
                    <Text>Enviando {progress.sent} de {progress.total}...</Text>
                    <Progress value={progress.total > 0 ? (progress.sent / progress.total) * 100 : 0} colorScheme="whatsapp" hasStripe isAnimated />
                    <Box bg="gray.100" p={3} borderRadius="md" h="150px" overflowY="auto">
                        <List spacing={2}>
                            {progressLog.map((log, index) => (
                                <ListItem key={index} fontSize="sm">
                                  <ListIcon as={log.success ? FiCheckCircle : FiXCircle} color={log.success ? 'green.500' : 'red.500'} />
                                  {`Enviado para: ${log.name}`}
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </VStack>
            )}
        </VStack>
      )}
    </Box>
  );
};

export default WhatsappPanel;