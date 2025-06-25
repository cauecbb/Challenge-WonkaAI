import { useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { isDuplicateName, getDuplicateErrorMessage } from '../utils/validation';

export const useDuplicateValidation = (
  existingItems: Array<{ name: string }>,
  itemType: string // 'product', 'zone', 'client', 'rule', etc.
) => {
  const toast = useToast();

  const validateAndShowError = useCallback((
    newName: string,
    currentItemId?: string
  ): boolean => {
    if (isDuplicateName(newName, existingItems, currentItemId)) {
      toast({
        title: 'Duplicate Name',
        description: getDuplicateErrorMessage(itemType, newName.trim()),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    return true;
  }, [existingItems, itemType, toast]);

  return { validateAndShowError };
};