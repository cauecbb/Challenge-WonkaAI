import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Center,
  VStack,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  Flex,
  useToast
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { Client, getAllClients, searchClients } from '../services/clients_service';

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Apply search when search term changes
  useEffect(() => {
    handleSearch();
  }, [searchTerm]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await getAllClients();
      setClients(clientsData);
      setFilteredClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      const results = await searchClients(searchTerm);
      setFilteredClients(results);
    } catch (error) {
      console.error('Error searching clients:', error);
      toast({
        title: "Search Error",
        description: "Failed to search clients. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSearching(false);
    }
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
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

  if (loading) {
    return (
      <Center height="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="#1c3661" />
          <Text>Loading clients...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6} height="100vh" overflow="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading as="h1" size="lg" color="#1c3661" mb={2}>
            SuperStore - Client Management
          </Heading>
          <Text color="gray.600">
            Manage and view all SuperStore customers. Total clients: {clients.length}
          </Text>
        </Box>

        {/* Search */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md" color="#1c3661">Search Clients</Heading>
              
              {/* Search Bar */}
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search by name or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Flex justify="space-between" align="center">
                <Text fontSize="sm" color="gray.600">
                  {searching ? "Searching..." : `Showing ${filteredClients.length} of ${clients.length} clients`}
                </Text>
              </Flex>
            </VStack>
          </CardBody>
        </Card>

        {/* Results */}
        <Card>
          <CardBody p={0}>
            <TableContainer>
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Name</Th>
                    <Th>Address</Th>
                    <Th>First Date</Th>
                    <Th isNumeric>Amount Due</Th>
                    <Th isNumeric>Number of Invoices</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <Tr key={client.id} _hover={{ bg: 'gray.50' }}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text 
                              fontWeight="semibold" 
                              color="blue.500" 
                              cursor="pointer"
                              _hover={{ textDecoration: 'underline' }}
                              onClick={() => handleClientClick(client.id)}
                            >
                              {client.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">{client.id}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Text>{client.address}</Text>
                        </Td>
                        <Td>{formatDate(client.firstDate)}</Td>
                        <Td isNumeric fontWeight="semibold" color={client.amountDue > 0 ? "red.500" : "green.500"}>
                          {formatCurrency(client.amountDue)}
                        </Td>
                        <Td isNumeric>{client.numberOfInvoices}</Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={5}>
                        <Center py={8}>
                          <VStack spacing={2}>
                            <Text fontSize="lg" color="gray.500">No clients found</Text>
                            <Text fontSize="sm" color="gray.400">
                              Try adjusting your search criteria
                            </Text>
                          </VStack>
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
    </Box>
  );
};

export default ClientsPage; 