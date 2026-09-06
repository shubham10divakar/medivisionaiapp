import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
});
