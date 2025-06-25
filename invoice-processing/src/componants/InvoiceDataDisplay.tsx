import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  useToast,
  Flex
} from '@chakra-ui/react';
import { InvoiceData } from '../services/invoice_service';
import { confirmInvoiceData } from '../services/invoice_service';

interface InvoiceDataDisplayProps {
  invoiceData: InvoiceData;
}

const InvoiceDataDisplay: React.FC<InvoiceDataDisplayProps> = ({ invoiceData }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const toast = useToast();

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      const result = await confirmInvoiceData(invoiceData);
      
      if (result.success) {
        toast({
          title: "Invoice Confirmed",
          description: `${result.message} Confirmation ID: ${result.confirmationId}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error confirming invoice:', error);
      toast({
        title: "Confirmation Failed",
        description: "Failed to confirm invoice. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsConfirming(false);
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
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Box height="100%" display="flex" flexDirection="column">
      {/* Scrollable Content Area */}
      <Box flex="1" overflow="auto" p={4}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Heading size="lg" color="#1c3661" mb={2}>
              Invoice Data Extracted
            </Heading>
            <Text color="gray.600">
              Review the extracted information below
            </Text>
          </Box>

          {/* Company Information */}
          <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
            <Heading size="md" mb={3} color="#1c3661">Company Information</Heading>
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text fontWeight="semibold">Company:</Text>
                <Text>{invoiceData.company}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="semibold">Bill To:</Text>
                <Text>{invoiceData.debiteurName}</Text>
              </HStack>
            </VStack>
          </Box>

          {/* Invoice Details */}
          <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
            <Heading size="md" mb={3} color="#1c3661">Invoice Details</Heading>
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text fontWeight="semibold">Invoice Number:</Text>
                <Badge colorScheme="blue" variant="subtle" fontSize="sm">
                  #{invoiceData.invoiceNumber}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="semibold">Date:</Text>
                <Text>{formatDate(invoiceData.invoiceDate)}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="semibold">Ship Mode:</Text>
                <Badge colorScheme="green" variant="outline">
                  {invoiceData.shipMode}
                </Badge>
              </HStack>
            </VStack>
          </Box>

          {/* Shipping Address */}
          <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
            <Heading size="md" mb={3} color="#1c3661">Shipping Address</Heading>
            <Text>{invoiceData.address.street}, {invoiceData.address.city}, {invoiceData.address.postalCode}, {invoiceData.address.country}</Text>
          </Box>

          {/* Line Items */}
          <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
            <Heading size="md" mb={3} color="#1c3661">Items</Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Item</Th>
                    <Th isNumeric>Quantity</Th>
                    <Th isNumeric>Rate</Th>
                    <Th isNumeric>Amount</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {invoiceData.items.map((item, index) => (
                    <Tr key={index}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold" fontSize="sm">{item.description}</Text>
                          <HStack spacing={2}>
                            <Badge variant="outline" size="xs">{item.category}</Badge>
                            <Text fontSize="xs" color="gray.500">{item.productCode}</Text>
                          </HStack>
                        </VStack>
                      </Td>
                      <Td isNumeric>{item.quantity}</Td>
                      <Td isNumeric>{formatCurrency(item.unitPrice)}</Td>
                      <Td isNumeric fontWeight="semibold">{formatCurrency(item.totalPrice)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {/* Financial Summary */}
          <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
            <Heading size="md" mb={3} color="#1c3661">Financial Summary</Heading>
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text>Subtotal:</Text>
                <Text>{formatCurrency(invoiceData.subtotal)}</Text>
              </HStack>
              
              {invoiceData.discountAmount > 0 && (
                <HStack justify="space-between">
                  <Text>Discount ({invoiceData.discountPercentage}%):</Text>
                  <Text color="green.500">-{formatCurrency(invoiceData.discountAmount)}</Text>
                </HStack>
              )}
              
              <HStack justify="space-between">
                <Text>Shipping:</Text>
                <Text>{formatCurrency(invoiceData.shippingAmount)}</Text>
              </HStack>
              
              <Divider />
              
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="bold">Total:</Text>
                <Text fontSize="lg" fontWeight="bold" color="#1c3661">
                  {formatCurrency(invoiceData.totalAmount)}
                </Text>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Box>

      {/* Fixed Action Button at Bottom */}
      <Box 
        p={4} 
        borderTop="1px solid" 
        borderColor="gray.200" 
        bg="white"
        flexShrink={0}
      >
        <Flex justify="center">
          <Button
            size="lg"
            bg="green.500"
            color="white"
            _hover={{ bg: 'green.600' }}
            onClick={handleConfirm}
            isLoading={isConfirming}
            loadingText="Confirming..."
            minWidth="200px"
          >
            ✓ Confirm Invoice
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default InvoiceDataDisplay; 