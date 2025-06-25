import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
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
  Grid,
  GridItem,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { InvoiceData, confirmInvoiceData } from '../services/invoice_service';

interface InvoiceDataPopupProps {
  invoiceData: InvoiceData;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceDataPopup: React.FC<InvoiceDataPopupProps> = ({ invoiceData, isOpen, onClose }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      
      const response = await confirmInvoiceData(invoiceData);
      
      if (response.success) {
        toast({
          title: "Invoice Confirmed",
          description: `${response.message} (ID: ${response.confirmationId})`,
          status: "success",
          duration: 4000,
          isClosable: true,
        });
        
        // Close modal after successful confirmation
        onClose();
      } else {
        toast({
          title: "Confirmation Failed",
          description: "Failed to confirm invoice data. Please try again.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error confirming invoice:', error);
      toast({
        title: "Error",
        description: "An error occurred while confirming the invoice.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0,0,0,0.7)"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="white"
        p={6}
        borderRadius="xl"
        width="90vw"
        maxWidth="900px"
        maxHeight="90vh"
        overflow="auto"
        boxShadow="2xl"
      >
        {/* Header */}
        <Flex justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg" color="#1c3661">
            Invoice Data Extracted
          </Heading>
          <HStack spacing={3}>
            <Button
              onClick={handleConfirm}
              size="md"
              bg="green.500"
              color="white"
              _hover={{ bg: 'green.600' }}
              isLoading={isConfirming}
              loadingText="Confirming..."
              spinner={<Spinner size="sm" />}
              isDisabled={isConfirming}
            >
              Confirm Invoice
            </Button>
            <Button
              onClick={onClose}
              size="md"
              variant="outline"
              borderColor="#1c3661"
              color="#1c3661"
              _hover={{ bg: '#f5f7fa' }}
              isDisabled={isConfirming}
            >
              Close
            </Button>
          </HStack>
        </Flex>

        {/* Company Information */}
        <Box mb={6}>
          <Heading size="md" mb={3} color="#1c3661">
            Company Information
          </Heading>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <GridItem>
              <Text fontSize="sm" color="gray.600" fontWeight="semibold">Company Name</Text>
              <Text fontSize="lg" fontWeight="bold">{invoiceData.company}</Text>
            </GridItem>
            <GridItem>
              <Text fontSize="sm" color="gray.600" fontWeight="semibold">Status</Text>
              <Badge colorScheme={invoiceData.isNewCompany ? "green" : "blue"} size="lg">
                {invoiceData.isNewCompany ? "New Company" : "Existing Company"}
              </Badge>
            </GridItem>
            <GridItem>
              <Text fontSize="sm" color="gray.600" fontWeight="semibold">Reference Number</Text>
              <Text>{invoiceData.vatNumber || "N/A"}</Text>
            </GridItem>
            <GridItem>
              <Text fontSize="sm" color="gray.600" fontWeight="semibold">Bill To</Text>
              <Text>{invoiceData.debiteurName}</Text>
            </GridItem>
          </Grid>
        </Box>

        <Divider mb={6} />

        {/* Invoice Details */}
        <Box mb={6}>
          <Heading size="md" mb={3} color="#1c3661">
            Invoice Details
          </Heading>
          <Grid templateColumns="repeat(3, 1fr)" gap={4}>
            <GridItem>
              <Text fontSize="sm" color="gray.600" fontWeight="semibold">Invoice Number</Text>
              <Text fontWeight="bold">{invoiceData.invoiceNumber}</Text>
            </GridItem>
            <GridItem>
              <Text fontSize="sm" color="gray.600" fontWeight="semibold">Invoice Date</Text>
              <Text>{invoiceData.invoiceDate}</Text>
            </GridItem>
            <GridItem>
              <Text fontSize="sm" color="gray.600" fontWeight="semibold">Due Date</Text>
              <Text>{invoiceData.dueDate}</Text>
            </GridItem>
          </Grid>
        </Box>

        <Divider mb={6} />

        {/* Shipping Information */}
        <Box mb={6}>
          <Heading size="md" mb={3} color="#1c3661">
            Shipping Information
          </Heading>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <GridItem>
              <Text fontSize="sm" color="gray.600" fontWeight="semibold">Ship To Address</Text>
              <VStack align="start" spacing={1}>
                <Text>{invoiceData.address.street}</Text>
                <Text>{invoiceData.address.city}, {invoiceData.address.postalCode}</Text>
                <Text>{invoiceData.address.country}</Text>
              </VStack>
            </GridItem>
            <GridItem>
              <Text fontSize="sm" color="gray.600" fontWeight="semibold">Ship Mode</Text>
              <Badge colorScheme="blue" size="lg">
                {invoiceData.shipMode}
              </Badge>
            </GridItem>
          </Grid>
        </Box>

        <Divider mb={6} />

        {/* Items */}
        <Box mb={6}>
          <Heading size="md" mb={3} color="#1c3661">
            Invoice Items
          </Heading>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Item Description</Th>
                  <Th>Product Code</Th>
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
                        <Text fontWeight="semibold">{item.description}</Text>
                        {item.category && (
                          <Text fontSize="xs" color="gray.500">{item.category}</Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm" fontFamily="mono">
                        {item.productCode || 'N/A'}
                      </Text>
                    </Td>
                    <Td isNumeric>{item.quantity}</Td>
                    <Td isNumeric>{formatCurrency(item.unitPrice, invoiceData.currency)}</Td>
                    <Td isNumeric fontWeight="semibold">{formatCurrency(item.totalPrice, invoiceData.currency)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Divider mb={6} />

        {/* Totals */}
        <Box>
          <Heading size="md" mb={3} color="#1c3661">
            Invoice Totals
          </Heading>
          <VStack align="end" spacing={2}>
            <HStack justify="space-between" w="350px">
              <Text>Subtotal:</Text>
              <Text fontWeight="semibold">{formatCurrency(invoiceData.subtotal, invoiceData.currency)}</Text>
            </HStack>
            <HStack justify="space-between" w="350px">
              <Text>Discount ({invoiceData.discountPercentage}%):</Text>
              <Text fontWeight="semibold" color="green.600">
                -{formatCurrency(invoiceData.discountAmount, invoiceData.currency)}
              </Text>
            </HStack>
            <HStack justify="space-between" w="350px">
              <Text>Shipping:</Text>
              <Text fontWeight="semibold">{formatCurrency(invoiceData.shippingAmount, invoiceData.currency)}</Text>
            </HStack>
            <HStack justify="space-between" w="350px" borderTop="2px solid" borderColor="gray.200" pt={2}>
              <Text fontSize="lg" fontWeight="bold">Balance Due:</Text>
              <Text fontSize="lg" fontWeight="bold" color="#1c3661">
                {formatCurrency(invoiceData.totalAmount, invoiceData.currency)}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Notes and Terms */}
        {(invoiceData.notes || invoiceData.terms) && (
          <>
            <Divider my={6} />
            <Box>
              <Heading size="md" mb={3} color="#1c3661">
                Additional Information
              </Heading>
              {invoiceData.notes && (
                <Box mb={3}>
                  <Text fontSize="sm" color="gray.600" fontWeight="semibold">Notes:</Text>
                  <Text>{invoiceData.notes}</Text>
                </Box>
              )}
              {invoiceData.terms && (
                <Box>
                  <Text fontSize="sm" color="gray.600" fontWeight="semibold">Terms:</Text>
                  <Text fontSize="sm" fontFamily="mono" color="gray.700">{invoiceData.terms}</Text>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default InvoiceDataPopup; 