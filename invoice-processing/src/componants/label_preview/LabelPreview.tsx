import { Box, Heading, Text, Flex, Button, Center, Image } from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { extractInvoiceData, InvoiceData } from '../../services/invoice_service';
import InvoiceDataDisplay from '../InvoiceDataDisplay';

// Add props interface
interface LabelPreviewProps {
 
  onPdfPreviewUrlChange: (url: string | null) => void;
}

// Custom icons using Box component
const DownloadIcon = () => (
  <Box as="span" mr={2} fontSize="18px">📄</Box>
);

// Custom toast interface
interface ToastMessage {
  title: string;
  description: string;
  status: 'info' | 'warning' | 'success' | 'error';
  duration?: number;
  isClosable?: boolean;
}

// Update component definition to accept props
const LabelPreview: React.FC<LabelPreviewProps> = ({ 
  onPdfPreviewUrlChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isFileSizeTooLarge, setIsFileSizeTooLarge] = useState(false);

  // Custom toast state
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  
  // Auto-clear toast after duration
  useEffect(() => {
    if (toastMessage && toastMessage.duration) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, toastMessage.duration);
      
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        handleFile(droppedFile);
      } else {
        setToastMessage({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (previewUrl) {
      // Revoke the old object URL if it exists
      URL.revokeObjectURL(previewUrl);
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    
    const fileSizeInMB = selectedFile.size / (1024 * 1024);
    setIsFileSizeTooLarge(false); // Reset on new file

    if (fileSizeInMB > 4) {
      setToastMessage({
        title: 'File is too large',
        description: `The file size (${fileSizeInMB.toFixed(2)} MB) exceeds the 4 MB limit. Please upload a smaller file.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsFileSizeTooLarge(true);
    } else if (fileSizeInMB > 3) {
      setToastMessage({
        title: 'Large file warning',
        description: `The file size is ${fileSizeInMB.toFixed(2)} MB. Processing may take a while.`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
    
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    onPdfPreviewUrlChange(objectUrl);
    
    // Clear previous invoice data
    setInvoiceData(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleExtractInvoiceData = async () => {
    if (!file) return;

    try {
      setIsLoading(true);
      setToastMessage({
        title: "Processing Invoice",
        description: "Extracting data from your invoice...",
        status: "info",
        duration: 3000,
        isClosable: true,
      });

      const extractedData = await extractInvoiceData(file);
      setInvoiceData(extractedData);
      
      setToastMessage({
        title: "Invoice Processed Successfully",
        description: "Invoice data has been extracted and is ready for review.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error extracting invoice data:', error);
      setToastMessage({
        title: "Processing Failed",
        description: "Failed to extract invoice data. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileName("");
    setInvoiceData(null);
    setIsFileSizeTooLarge(false);
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      onPdfPreviewUrlChange(null);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box height="100%" width="100%" display="flex" flexDirection="column" position="relative">
      {/* Toast Message */}
      {toastMessage && (
        <Box
          position="fixed"
          top="20px"
          right="20px"
          zIndex={1001}
          bg={toastMessage.status === 'error' ? 'red.500' : 
              toastMessage.status === 'warning' ? 'orange.500' : 
              toastMessage.status === 'success' ? 'green.500' : 'blue.500'}
          color="white"
          p={4}
          borderRadius="md"
          boxShadow="lg"
          maxWidth="400px"
        >
          <Text fontWeight="bold" mb={1}>{toastMessage.title}</Text>
          <Text fontSize="sm">{toastMessage.description}</Text>
        </Box>
      )}

      {/* Show invoice data if extracted, otherwise show upload interface */}
      {invoiceData ? (
        <>
          {/* Reset button - positioned absolutely at top right */}
          <Button
            position="absolute"
            top={2}
            right={2}
            size="sm"
            variant="outline"
            onClick={handleReset}
            zIndex={10}
            bg="white"
            _hover={{ bg: "gray.50" }}
          >
            Upload New File
          </Button>
          
          {/* Invoice data display - takes full height */}
          <Box height="100%" width="100%">
            <InvoiceDataDisplay invoiceData={invoiceData} />
          </Box>
        </>
      ) : (
        <Box p={4} height="100%" display="flex" flexDirection="column">
          <Heading as="h2" size="lg" mb={4} textAlign="center">
            Invoice Data Extractor
          </Heading>
          
          <Text textAlign="center" color="gray.600" mb={6}>
            Upload a PDF invoice to extract company information, amounts, and line items
          </Text>

          <Box flex="1" display="flex" flexDirection="column">
            {/* File Upload Area */}
            <Center
              flexDirection="column"
              minHeight="200px"
              border="2px dashed"
              borderColor={isDragging ? "blue.400" : "gray.300"}
              borderRadius="md"
              p={6}
              mb={4}
              bg={isDragging ? "blue.50" : "gray.50"}
              cursor="pointer"
              transition="all 0.2s"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <Text fontSize="6xl" mb={2}>📄</Text>
              <Text fontSize="lg" fontWeight="semibold" mb={2}>
                {isDragging ? "Drop your PDF here" : "Drag & drop PDF or click to select"}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Supported format: PDF (max 4MB)
              </Text>
            </Center>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {/* File Information */}
            {file && (
              <Box bg="gray.100" p={3} borderRadius="md" mb={4}>
                <Text fontSize="sm" color="gray.600">Selected file:</Text>
                <Text fontWeight="semibold">{fileName}</Text>
                <Text fontSize="xs" color="gray.500">
                  Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                </Text>
              </Box>
            )}

            {/* File uploaded successfully message */}
            {previewUrl && (
              <Box bg="green.50" border="1px solid" borderColor="green.200" borderRadius="md" p={3} mb={4}>
                <Text fontSize="sm" color="green.700" fontWeight="semibold">
                  ✅ PDF uploaded successfully! 
                </Text>
                <Text fontSize="xs" color="green.600">
                  View your document in the preview panel on the right →
                </Text>
              </Box>
            )}

            {/* Controls */}
            <Flex justifyContent="flex-end" mb={4}>
              <Button
                size="md"
                variant="outline"
                onClick={handleReset}
              >
                Reset
              </Button>
            </Flex>

            <Button 
              width="100%"
              bg="#1c3661"
              color="white"
              _hover={{ bg: '#2c4a6f' }}
              onClick={handleExtractInvoiceData}
              isDisabled={isLoading || !file || isFileSizeTooLarge}
              size="md"
              height="40px"
            >
              {isLoading ? (
                "Extracting Data..."
              ) : (
                <>
                  <DownloadIcon />
                  Extract Data from Invoice
                </>
              )}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LabelPreview; 