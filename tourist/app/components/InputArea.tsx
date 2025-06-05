import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface Props {
  inputText: string;
  setInputText: (value: string) => void;
  handleSend: () => void;
  callStatus: "idle" | "connecting" | "connected" | "active" | "error";
  defaultPhoneNumber: string;
}

const InputArea: React.FC<Props> = ({
  inputText,
  setInputText,
  handleSend,
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.inputContainer}
    >
      <LinearGradient
        colors={["#F0F9FF", "#F0F9FF"]}
        style={styles.inputWrapper}
      >
        <Ionicons
          name="sparkles-outline"
          size={24}
          color="#60A5FA"
          style={styles.aiIcon}
        />
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about your trip..."
          placeholderTextColor="#93C5FD"
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <LinearGradient
            colors={inputText.trim() ? ["#60A5FA", "#3B82F6"] : ["#D1D5DB", "#D1D5DB"]}
            style={styles.buttonGradient}
          >
            <Ionicons name="paper-plane-outline" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#BFDBFE",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiIcon: {
    marginLeft: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#3B82F6",
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default InputArea;