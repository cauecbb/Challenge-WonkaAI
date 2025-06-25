import { 
  Box, 
  Stack,
  Text,
  Flex,
  IconButton,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge
} from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight, FiLogOut } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
// Authentication removed - no longer needed

interface NavItemProps {
  iconSrc: string;
  children: string;
  isActive?: boolean;
  onClick?: () => void;
  showText?: boolean;
}

const NavItem = ({ iconSrc, children, isActive = false, onClick, showText = true }: NavItemProps & { showText?: boolean }) => {
  const activeColor = 'blue.600';
  const hoverBg = 'gray.100';
  const bg = isActive ? 'gray.200' : 'transparent';
  const color = isActive ? activeColor : 'gray.700';
  const padding = showText ? "4" : "1";

  return (
    <Flex
      align="center"
      p={padding}
      mx="4"
      borderRadius="lg"
      role="group"
      cursor="pointer"
      bg={bg}
      color={color}
      _hover={{
        bg: hoverBg,
        color: activeColor,
      }}
      transition="all 0.3s"
      onClick={onClick}
      justifyContent={showText ? 'flex-start' : 'center'}
    >
      {iconSrc && (
        <img
          src={iconSrc}
          alt={children + " icon"}
          style={{
            height: '20px',
            width: '20px',
            marginRight: showText ? '16px' : '0',
            transition: 'filter 0.3s'
          }}
        />
      )}
      {showText && <Text fontWeight={isActive ? 'bold' : 'medium'}>{children}</Text>}
    </Flex>
  );
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  reportGenerated?: boolean;
}

const Sidebar = ({ isOpen, setIsOpen, reportGenerated }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Authentication removed - all features now accessible
  const bgColor = 'white';
  const borderColor = 'gray.200';

  useEffect(() => {
    if (reportGenerated) {
      setIsOpen(false);
    }
  }, [reportGenerated, setIsOpen]);

  const isPathActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    navigate('/');
  };

  const getUserInitials = () => {
    return 'US'; // Default user initials since auth is removed
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'red';
      case 'superadmin':
        return 'purple';
      case 'moderator':
        return 'orange';
      case 'user':
        return 'blue';
      default:
        return 'gray';
    }
  };
  
  // Simplified navigation - dashboard and clients available

  return (
    <Box
      position="fixed"
      left="0"
      h="100vh"
      w={{ base: isOpen ? '250px' : '60px', md: isOpen ? '250px' : '60px' }}
      bg={bgColor}
      borderRight="1px"
      borderRightColor={borderColor}
      transition="width 0.3s ease"
      overflow="hidden"
      zIndex="1"
      display="flex"
      flexDirection="column"
    >
      <Flex h="20" alignItems="center" mx="4" justifyContent={isOpen ? 'space-between' : 'center'}>
        {isOpen && (
          <img src="/wonka-logo.png" alt="Wonka" style={{ height: '50px', objectFit: 'contain' }} />
        )}
        <IconButton
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          icon={isOpen ? <FiChevronLeft /> : <FiChevronRight />}
          size="sm"
          onClick={() => setIsOpen((prev) => !prev)}
          variant="ghost"
        />
      </Flex>
      <Box height="1px" bg={borderColor} my="2" />
      
      <Box flex="1">
        <Stack direction="column" gap="2" alignItems="stretch" mt="6">
          <NavItem 
            iconSrc={isPathActive('/') || isPathActive('/dashboard') ? "/heart_purple.png" : "/heart_red.png"}
            isActive={isPathActive('/') || isPathActive('/dashboard')} 
            onClick={() => navigate('/dashboard')}
            showText={isOpen}
          >
            Dashboard
          </NavItem>

          <NavItem 
            iconSrc={isPathActive('/clients') ? "/cross_purple.png" : "/cross_red.png"}
            isActive={isPathActive('/clients')}
            onClick={() => navigate('/clients')}
            showText={isOpen}
          >
            Clients
          </NavItem>
        </Stack>
      </Box>

      {/* User Section */}
      <Box borderTop="1px" borderTopColor={borderColor} p="4">
        <Menu>
          <MenuButton as={Box} cursor="pointer">
            <Flex align="center" justify={isOpen ? 'flex-start' : 'center'}>
              <Avatar 
                size="sm" 
                name={getUserInitials()}
                bg="blue.500"
                color="white"
              />
              {isOpen && (
                <Box ml="3" flex="1" overflow="hidden">
                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                    Guest User
                  </Text>
                  <Text fontSize="xs" fontWeight="medium" color="gray.700" noOfLines={1}>
                    No authentication required
                  </Text>
                </Box>
              )}
            </Flex>
          </MenuButton>
          <MenuList>
            <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
              Back to Landing
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </Box>
  );
};

export default Sidebar; 