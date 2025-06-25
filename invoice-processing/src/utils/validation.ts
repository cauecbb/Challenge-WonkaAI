// Utility function for checking duplicate names (case-insensitive)
export const isDuplicateName = (
    newName: string, 
    existingItems: Array<{ name: string }>,
    currentItemId?: string
  ): boolean => {
    const trimmedName = newName.trim().toLowerCase();
    
    return existingItems.some(item => 
      item.name.toLowerCase() === trimmedName && 
      (currentItemId ? (item as any).id !== currentItemId : true)
    );
  };
  
  // Generate consistent error messages
  export const getDuplicateErrorMessage = (itemType: string, name: string): string => {
    return `A ${itemType} with the name "${name}" already exists. Please choose a different name.`;
  }; 