import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Spinner,
  Center,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Flex,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { 
  Client, 
  Transaction, 
  getClientById, 
  getClientTransactions, 
  markInvoiceAsPaid 
} from '../services/clients_service';

const ClientDetailsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const [client, setClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      const [clientData, transactionsData] = await Promise.all([
        getClientById(clientId),
        getClientTransactions(clientId)
      ]);
      
      setClient(clientData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading client data:', error);
      toast({
        title: "Error",
        description: "Failed to load client data. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClick = (transaction: Transaction) => {
    setSelectedInvoice(transaction);
    onOpen();
  };

  const confirmPayment = async () => {
    if (!selectedInvoice) return;
    
    try {
      setPayingInvoice(selectedInvoice.id);
      const result = await markInvoiceAsPaid(selectedInvoice.invoiceNumber);
      
      if (result.success) {
        // Update the transaction in the local state
        setTransactions(prev => 
          prev.map(t => 
            t.id === selectedInvoice.id 
              ? { ...t, isPaid: true }
              : t
          )
        );
        
        // Update client amount due
        if (client) {
          setClient(prev => prev ? {
            ...prev,
            amountDue: Math.max(0, prev.amountDue - selectedInvoice.amount)
          } : null);
        }
        
        toast({
          title: "Payment Confirmed",
          description: result.message,
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setPayingInvoice(null);
      setSelectedInvoice(null);
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalPaid = () => {
    return transactions
      .filter(t => t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalUnpaid = () => {
    return transactions
      .filter(t => !t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  if (loading) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="#1c3661" />
          <Text>Loading client details...</Text>
        </VStack>
      </Center>
    );
  }

  if (!client) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Text fontSize="lg" color="red.500">Client not found</Text>
          <Button leftIcon={<ArrowBackIcon />} onClick={() => navigate('/clients')}>
            Back to Clients
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6} height="100vh" overflow="auto">
      <VStack spacing={6} align="stretch">
        {/* Header with Back Button */}
        <Flex justify="space-between" align="center">
          <Button 
            leftIcon={<ArrowBackIcon />} 
            variant="ghost" 
            onClick={() => navigate('/clients')}
          >
            Back to Clients
          </Button>
        </Flex>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <Heading size="lg" color="#1c3661">
              {client.name}
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between" wrap="wrap">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">Address</Text>
                  <Text fontWeight="semibold">{client.address}</Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">First Date</Text>
                  <Text fontWeight="semibold">{formatDate(client.firstDate)}</Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">Total Invoices</Text>
                  <Text fontWeight="semibold">{client.numberOfInvoices}</Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">Amount Due</Text>
                  <Text fontWeight="semibold" color={client.amountDue > 0 ? "red.500" : "green.500"}>
                    {formatCurrency(client.amountDue)}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Transaction Summary */}
        <Card>
          <CardBody>
            <HStack justify="space-around" wrap="wrap">
              <VStack>
                <Text fontSize="sm" color="gray.600">Total Paid</Text>
                <Text fontSize="xl" fontWeight="bold" color="green.500">
                  {formatCurrency(getTotalPaid())}
                </Text>
              </VStack>
              <VStack>
                <Text fontSize="sm" color="gray.600">Total Unpaid</Text>
                <Text fontSize="xl" fontWeight="bold" color="red.500">
                  {formatCurrency(getTotalUnpaid())}
                </Text>
              </VStack>
              <VStack>
                <Text fontSize="sm" color="gray.600">Total Transactions</Text>
                <Text fontSize="xl" fontWeight="bold" color="#1c3661">
                  {transactions.length}
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <Heading size="md" color="#1c3661">Transaction History</Heading>
          </CardHeader>
          <CardBody p={0}>
            <TableContainer>
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Invoice Number</Th>
                    <Th>Date</Th>
                    <Th>Description</Th>
                    <Th isNumeric>Amount</Th>
                    <Th>Status</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <Tr key={transaction.id} _hover={{ bg: 'gray.50' }}>
                        <Td fontWeight="semibold">{transaction.invoiceNumber}</Td>
                        <Td>{formatDate(transaction.date)}</Td>
                        <Td>{transaction.description}</Td>
                        <Td isNumeric fontWeight="semibold">
                          {formatCurrency(transaction.amount)}
                        </Td>
                        <Td>
                          <Badge 
                            colorScheme={transaction.isPaid ? 'green' : 'red'} 
                            variant="subtle"
                          >
                            {transaction.isPaid ? 'PAID' : 'UNPAID'}
                          </Badge>
                        </Td>
                        <Td>
                          {!transaction.isPaid && (
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handlePaymentClick(transaction)}
                              isLoading={payingInvoice === transaction.id}
                              loadingText="Processing..."
                            >
                              Mark as Paid
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={6}>
                        <Center py={8}>
                          <Text fontSize="lg" color="gray.500">No transactions found</Text>
                        </Center>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      </VStack>

      {/* Payment Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm Payment
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to mark invoice{' '}
              <Text as="span" fontWeight="bold" color="#1c3661">
                {selectedInvoice?.invoiceNumber}
              </Text>{' '}
              for{' '}
              <Text as="span" fontWeight="bold" color="green.500">
                {selectedInvoice ? formatCurrency(selectedInvoice.amount) : ''}
              </Text>{' '}
              as paid?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={confirmPayment} 
                ml={3}
                isLoading={payingInvoice !== null}
                loadingText="Processing..."
              >
                Confirm Payment
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ClientDetailsPage; 