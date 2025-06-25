import { Box, useColorModeValue } from '@chakra-ui/react';
import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Header from './header/Header';
import LabelPreview from './label_preview/LabelPreview';
import PdfViewer from './PdfViewer';


interface LabelValidationPageProps {
  onReportStatusChange?: (isInitiated: boolean) => void;
}

const LabelValidationPage: React.FC<LabelValidationPageProps> = ({ onReportStatusChange }) => {
  // State for individual report results (keeping for compatibility)
  
 
  const [currentPdfPreviewUrl, setCurrentPdfPreviewUrl] = useState<string | null>(null);

  const [leftPanelSize, setLeftPanelSize] = useState<number>(() => {
    const saved = localStorage.getItem('labelValidationLeftPanelSize');
    return saved ? parseInt(saved, 10) : 50;
  });
  
  const handleResize = (sizes: number[]) => {
    setLeftPanelSize(sizes[0]);
    localStorage.setItem('labelValidationLeftPanelSize', sizes[0].toString());
  };

  // Handler for PDF preview URL change from LabelPreview
  const handlePdfPreviewUrlChange = (url: string | null) => {
    setCurrentPdfPreviewUrl(url);
  };

  // Handler functions for each report type (keeping for compatibility)

  // Handler for report process initiation status
  

  const handleDragColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box className="label-validation-container" height="100vh" width="100%" overflow="hidden">
      <Box bg="#f5f7fa" height="100%" display="flex" flexDirection="column">
        <Header title="Invoice Data Extractor" />
        <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
          <PanelGroup 
            direction="horizontal" 
            onLayout={handleResize}
            autoSaveId="invoice-layout"
            style={{ height: '100%', width: '100%' }}
          >
            <Panel defaultSize={leftPanelSize} minSize={30}>
              <Box
                height="100%"
                overflow="hidden"
                display="flex"
                flexDirection="column"
              >
                <LabelPreview
                  
                  onPdfPreviewUrlChange={handlePdfPreviewUrlChange}
                  
                />
              </Box>
            </Panel>
            
            <PanelResizeHandle>
              <Box 
                width="6px" 
                height="100%" 
                cursor="col-resize"
                bg={handleDragColor}
                _hover={{ bg: "#1c3a5f" }}
                transition="background 0.2s"
              />
            </PanelResizeHandle>
            
            <Panel minSize={30}>
              <Box
                height="100%"
                overflow="hidden"
                display="flex"
                flexDirection="column"
                p={2}
              >
                <PdfViewer 
                  pdfUrl={currentPdfPreviewUrl}
                />
              </Box>
            </Panel>
          </PanelGroup>
        </Box>
      </Box>
    </Box>
  );
};

export default LabelValidationPage;