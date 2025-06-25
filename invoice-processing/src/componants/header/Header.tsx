import { Box, Heading } from '@chakra-ui/react';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <Box
      as="header"
      bg="linear-gradient(to right,#8053c2,rgb(173, 27, 117), #d32528)" // Updated gradient
      color="white"
      py={4}
      px={6}
      width="100%"
    >
      <Heading as="h1" size="lg">
        {title || "Label Validation"}
      </Heading>
    </Box>
  );
};

export default Header; 