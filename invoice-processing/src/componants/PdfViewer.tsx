import React from 'react';
import { Box, Center, Text, Heading } from '@chakra-ui/react';

interface PdfViewerProps {
  pdfUrl: string | null;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl }) => {
  if (!pdfUrl) {
    return (
      <Box
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        bg="gray.50"
        borderRadius="md"
        border="2px dashed"
        borderColor="gray.300"
      >
        <Text fontSize="6xl" mb={4} color="gray.400">📄</Text>
        <Heading size="md" mb={2} color="gray.600">
          PDF Preview
        </Heading>
        <Text color="gray.500" textAlign="center">
          Upload a PDF invoice to see it here
        </Text>
      </Box>
    );
  }

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Box mb={3}>
        <Heading size="md" color="#1c3661">
          PDF Preview
        </Heading>
        <Text fontSize="sm" color="gray.600">
          Your uploaded invoice document
        </Text>
      </Box>
      
      <Box
        flex="1"
        border="1px solid"
        borderColor="gray.300"
        borderRadius="md"
        overflow="hidden"
        bg="white"
      >
        <iframe
          src={pdfUrl}
          width="100%"
          height="100%"
          style={{
            border: 'none',
            display: 'block'
          }}
          title="PDF Document Viewer"
        />
      </Box>
    </Box>
  );
};

export default PdfViewer; 