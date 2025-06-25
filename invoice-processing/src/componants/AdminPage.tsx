import { Box, Spinner, Table, Tbody, Td, Th, Thead, Tr, Text, Alert, AlertIcon, Select, useToast, Button, Collapse, Grid, useDisclosure } from "@chakra-ui/react";
import { InfoIcon } from "@chakra-ui/icons";
import Header from "./header/Header";
import { useEffect, useState } from "react";
import { authService, User } from "../services/auth_service";

const ROLES: string[] = ["user", "moderator", "admin", "superadmin"];

// Role descriptions data
const roleDescriptions = [
    {
        name: "User",
        permissions: ["Only views Dashboard"]
    },
    {
        name: "Moderator", 
        permissions: ["All User permissions", "Access to Rule Manager", "Can edit rules in Rule Manager"]
    },
    {
        name: "Admin",
        permissions: ["All Moderator permissions", "Access to Settings and Admin Page", "Can change user roles (except superadmin)"]
    },
    {
        name: "Superadmin",
        permissions: ["Unlimited permissions"]
    }
];

const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { isOpen: showRoleInfo, onToggle: toggleRoleInfo } = useDisclosure();
    const toast = useToast();

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const loggedInUser = authService.getUser();
                setCurrentUser(loggedInUser);

                if (loggedInUser) {
                    const fetchedUsers = await authService.getAllUsers();
                    setUsers(fetchedUsers);
                    setError(null);
                } else {
                    setError("User not authenticated. Please log in.");
                     toast({
                        title: "Authentication Error",
                        description: "User not authenticated. Please log in.",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    });
                }
            } catch (err) {
                const errorMessage = (err as Error).message || "Failed to fetch initial data";
                setError(errorMessage);
                toast({
                    title: "Error",
                    description: errorMessage,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                console.error("Fetch initial data error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [toast]);

    const handleRoleChange = async (userIdToUpdate: string, newRole: string) => {
        if (!currentUser) {
            toast({ title: "Error", description: "Current user not found.", status: "error", duration: 3000, isClosable: true });
            return;
        }

        const userToUpdate = users.find(u => u.id === userIdToUpdate);
        if (!userToUpdate) {
            toast({ title: "Error", description: "User to update not found.", status: "error", duration: 3000, isClosable: true });
            return;
        }

        const originalRole = userToUpdate.role;

        // Handle self-role change
        if (currentUser.id === userIdToUpdate) {
            if (currentUser.role === "superadmin" && newRole !== "superadmin") {
                const otherSuperAdmins = users.filter(u => u.id !== currentUser.id && u.role === "superadmin");
                if (otherSuperAdmins.length === 0) {
                    toast({
                        title: "Action Denied",
                        description: "You are the last superadmin. Please assign another user as superadmin before changing your role.",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    });
                    
                    setUsers(prevUsers => prevUsers.map(u => u.id === userIdToUpdate ? { ...u, role: originalRole } : u));
                    return;
                }
            }

            const confirmChange = window.confirm(`Are you sure you want to change your own role from ${originalRole} to ${newRole}?`);
            if (!confirmChange) {
                
                setUsers(prevUsers => prevUsers.map(u => u.id === userIdToUpdate ? { ...u, role: originalRole } : u));
                return;
            }
        }
        
        const originalUsers = users.map(u => ({...u})); 

        setUsers(prevUsers => prevUsers.map(u => u.id === userIdToUpdate ? { ...u, role: newRole } : u));

        try {
            await authService.updateUser(userIdToUpdate, { role: newRole });
            toast({
                title: "Success",
                description: `User ${userToUpdate.email}'s role updated to ${newRole}.`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            if (currentUser.id === userIdToUpdate) {
                setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
            }
        } catch (err) {
            setUsers(originalUsers); // Revert on error
            const errorMessage = (err as Error).message || `Failed to update role for ${userToUpdate.email}`;
            setError(errorMessage);
            toast({
                title: "Update Failed",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            console.error("Role update error:", err);
        }
    };

    const canChangeRoleForTarget = (targetUser: User): boolean => {
        if (!currentUser) return false;
        if (currentUser.id === targetUser.id) return true;
        if (currentUser.role === "superadmin") {
            return targetUser.role !== "superadmin";
        }
        if (currentUser.role === "admin") {
            return targetUser.role !== "admin" && targetUser.role !== "superadmin";
        }
        return false;
    };

    return (
      <Box className="rule-manager-container" height="100vh" width="100%" overflow="hidden">
        <Box height="100%" display="flex" flexDirection="column">
           <Header title="Admin Page" />
            <Box p={5} overflowY="auto">

                {/* Role Information Panel */}
                <Box mb={6}>
                    <Button
                        leftIcon={<InfoIcon />}
                        variant="outline"
                        onClick={toggleRoleInfo}
                        colorScheme="blue"
                        size="sm"
                    >
                        {showRoleInfo ? 'Hide' : 'Show'} Role Permissions
                    </Button>
                    
                    <Collapse in={showRoleInfo} animateOpacity>
                        <Box p={4} mt={3} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
                            <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.700">
                                Platform Role Permissions
                            </Text>
                            <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                                {roleDescriptions.map((role, index) => (
                                    <Box 
                                        key={role.name} 
                                        p={4} 
                                        bg="white" 
                                        borderRadius="md" 
                                        shadow="sm"
                                        border="1px solid"
                                        borderColor="gray.100"
                                        _hover={{ shadow: "md", borderColor: "blue.200" }}
                                        transition="all 0.2s"
                                    >
                                        <Text 
                                            fontWeight="bold" 
                                            color={
                                                index === 0 ? "green.600" :
                                                index === 1 ? "blue.600" :
                                                index === 2 ? "orange.600" : "red.600"
                                            }
                                            fontSize="md"
                                            mb={3}
                                        >
                                            {role.name}
                                        </Text>
                                        <Box>
                                            <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2}>
                                                PERMISSIONS:
                                            </Text>
                                            {role.permissions.map((permission, permIndex) => (
                                                <Text key={permIndex} fontSize="xs" color="gray.600" ml={2} mb={1}>
                                                    • {permission}
                                                </Text>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </Grid>
                        </Box>
                    </Collapse>
                </Box>

                {loading && <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />}
                {error && !loading && (
                    <Alert status="error" mb={4}>
                        <AlertIcon />
                        {error}
                    </Alert>
                )}
                {!loading && !error && currentUser && users.length === 0 && (
                    <Text>No users found.</Text>
                )}
                {!loading && currentUser && users.length > 0 && (
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>Email</Th>
                                <Th>First Name</Th>
                                <Th>Last Name</Th>
                                <Th>Role</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {users.map((user) => {
                                const isChangeable = canChangeRoleForTarget(user);
                                
                                return (
                                    <Tr key={user.id}>
                                        <Td>{user.email}</Td>
                                        <Td>{user.firstname}</Td>
                                        <Td>{user.lastname}</Td>
                                        <Td>
                                            {isChangeable ? (
                                                <Select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    minW="120px"
                                                >
                                                    {ROLES.map(roleOption => {
                                                        let isDisabled = false;
                                                        const currentUserRoleIndex = ROLES.indexOf(currentUser.role);
                                                        const roleOptionIndex = ROLES.indexOf(roleOption);

                                                        if (currentUser.id !== user.id) { // Logic for changing OTHER users' roles
                                                            if (currentUser.role === "admin" && roleOption === "superadmin") {
                                                                isDisabled = true;
                                                            }
                                                        } else { // Logic for changing OWN role
                                                            if (roleOptionIndex > currentUserRoleIndex) {
                                                                isDisabled = true;
                                                            }
                                                            if (currentUser.role === "superadmin" && roleOption !== "superadmin") {
                                                                const otherSuperAdmins = users.filter(u => u.id !== currentUser.id && u.role === "superadmin");
                                                                if (otherSuperAdmins.length === 0) {
                                                                    isDisabled = true;
                                                                }
                                                            }
                                                        }

                                                        return (
                                                            <option 
                                                                key={roleOption} 
                                                                value={roleOption}
                                                                disabled={isDisabled}
                                                            >
                                                                {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                                                            </option>
                                                        );
                                                    })}
                                                </Select>
                                            ) : (
                                                <Text>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
                                            )}
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                )}
          </Box>
        </Box>
      </Box>
    );
  };
  
  export default AdminPage;