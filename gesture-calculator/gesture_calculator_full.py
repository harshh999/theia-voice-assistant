import sys
import cv2
import mediapipe as mp
import numpy as np
from PyQt6.QtWidgets import QApplication, QWidget, QGridLayout, QPushButton, QLineEdit, QVBoxLayout
from PyQt6.QtCore import Qt, QThread, pyqtSignal

# -----------------------
# PyQt Calculator UI
# -----------------------
class Calculator(QWidget):
    button_clicked = pyqtSignal(str)

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Gesture Calculator")
        self.setFixedSize(300, 400)
        self.setStyleSheet("background-color: #121212;")

        main_layout = QVBoxLayout()
        self.display = QLineEdit()
        self.display.setAlignment(Qt.AlignmentFlag.AlignRight)
        self.display.setFixedHeight(50)
        self.display.setStyleSheet(
            "font-size: 24px; color: white; background-color: #1f1f1f; border: none; padding: 10px;"
        )
        main_layout.addWidget(self.display)

        grid = QGridLayout()
        buttons = [
            ('7', 0, 0), ('8', 0, 1), ('9', 0, 2), ('/', 0, 3),
            ('4', 1, 0), ('5', 1, 1), ('6', 1, 2), ('*', 1, 3),
            ('1', 2, 0), ('2', 2, 1), ('3', 2, 2), ('-', 2, 3),
            ('0', 3, 0), ('.', 3, 1), ('=', 3, 2), ('+', 3, 3),
            ('C', 4, 0)
        ]

        for text, row, col in buttons:
            button = QPushButton(text)
            button.setFixedSize(60, 60)
            button.setStyleSheet("""
                QPushButton {
                    font-size: 20px;
                    color: white;
                    background-color: #333333;
                    border-radius: 10px;
                }
                QPushButton:pressed {
                    background-color: #555555;
                }
            """)
            button.clicked.connect(self.on_button_click)
            grid.addWidget(button, row, col)

        main_layout.addLayout(grid)
        self.setLayout(main_layout)
        self.button_clicked.connect(self.handle_gesture_click)

    def on_button_click(self):
        sender = self.sender().text()
        self.handle_click(sender)

    def handle_gesture_click(self, text):
        self.handle_click(text)

    def handle_click(self, text):
        if text == "C":
            self.display.clear()
        elif text == "=":
            try:
                self.display.setText(str(eval(self.display.text())))
            except:
                self.display.setText("Error")
        else:
            self.display.setText(self.display.text() + text)

# -----------------------
# MediaPipe Gesture Thread
# -----------------------
class GestureThread(QThread):
    button_signal = pyqtSignal(str)

    def __init__(self, button_map):
        super().__init__()
        self.button_map = button_map
        self.running = True

    def run(self):
        mp_hands = mp.solutions.hands
        hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)
        mp_draw = mp.solutions.drawing_utils

        cap = cv2.VideoCapture(0)
        while self.running:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = hands.process(rgb_frame)

            if result.multi_hand_landmarks:
                for hand_landmarks in result.multi_hand_landmarks:
                    mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                    h, w, _ = frame.shape
                    index_tip = hand_landmarks.landmark[8]
                    thumb_tip = hand_landmarks.landmark[4]
                    x, y = int(index_tip.x * w), int(index_tip.y * h)

                    # Detect pinch gesture
                    distance = np.hypot((thumb_tip.x - index_tip.x), (thumb_tip.y - index_tip.y))
                    if distance < 0.05:  # Pinch detected
                        button_text = self.detect_button(x, y)
                        if button_text:
                            self.button_signal.emit(button_text)

            cv2.imshow("Gesture Tracking", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.running = False

        cap.release()
        cv2.destroyAllWindows()

    def detect_button(self, x, y):
        # This maps finger positions to calculator grid areas (basic hit test)
        for text, (bx, by, bw, bh) in self.button_map.items():
            if bx < x < bx + bw and by < y < by + bh:
                return text
        return None

# -----------------------
# Main Application
# -----------------------
if __name__ == "__main__":
    app = QApplication(sys.argv)
    calc = Calculator()

    # Define button areas (camera-based approx.)
    button_map = {
        '7': (50, 50, 60, 60),
        '8': (150, 50, 60, 60),
        '9': (250, 50, 60, 60),
        '/': (350, 50, 60, 60),
        '4': (50, 150, 60, 60),
        '5': (150, 150, 60, 60),
        '6': (250, 150, 60, 60),
        '*': (350, 150, 60, 60),
        '1': (50, 250, 60, 60),
        '2': (150, 250, 60, 60),
        '3': (250, 250, 60, 60),
        '-': (350, 250, 60, 60),
        '0': (50, 350, 60, 60),
        '.': (150, 350, 60, 60),
        '=': (250, 350, 60, 60),
        '+': (350, 350, 60, 60),
        'C': (50, 450, 60, 60),
    }

    gesture_thread = GestureThread(button_map)
    gesture_thread.button_signal.connect(calc.handle_gesture_click)
    gesture_thread.start()

    calc.show()
    sys.exit(app.exec())

