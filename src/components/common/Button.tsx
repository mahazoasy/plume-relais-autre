import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyles = () => {
    const baseStyles: ViewStyle = styles.button;
    const sizeStyles: ViewStyle = styles[`${size}Button`];
    const variantStyles: ViewStyle = styles[`${variant}Button`];
    const disabledStyles: ViewStyle = disabled ? styles.disabledButton : {};
    return { ...baseStyles, ...sizeStyles, ...variantStyles, ...disabledStyles, ...style };
  };

  const getTextStyles = () => {
    const baseStyles: TextStyle = styles.text;
    const variantTextStyles: TextStyle = styles[`${variant}Text`];
    const disabledTextStyles: TextStyle = disabled ? styles.disabledText : {};
    return { ...baseStyles, ...variantTextStyles, ...disabledTextStyles, ...textStyle };
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={getTextStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  smallButton: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 36 },
  mediumButton: { paddingHorizontal: 24, paddingVertical: 12, minHeight: 48 },
  largeButton: { paddingHorizontal: 32, paddingVertical: 16, minHeight: 56 },
  primaryButton: { backgroundColor: '#6C63FF' },
  secondaryButton: { backgroundColor: '#F0F0F0' },
  outlineButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#6C63FF' },
  dangerButton: { backgroundColor: '#FF3B30' },
  text: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: '#FFFFFF' },
  secondaryText: { color: '#333333' },
  outlineText: { color: '#6C63FF' },
  dangerText: { color: '#FFFFFF' },
  disabledButton: { opacity: 0.5 },
  disabledText: { opacity: 0.5 },
});