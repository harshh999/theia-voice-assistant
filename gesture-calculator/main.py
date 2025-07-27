import cv2
import mediapipe as mp
import numpy as np

# -----------------------
# MediaPipe setup
# -----------------------
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)
mp_draw = mp.solutions.drawing_utils

# -----------------------
# UI: Button class
# -----------------------
class Button:
    def __init__(self, pos, text, size=(90, 90)):
        self.pos = pos  # (x, y)
        self.size = size  # (w, h)
        self.text = text

    def draw(self, img, pressed=False):
        x, y = self.pos
        w, h = self.size

        # Colors
        shadow = (25, 25, 25)
        normal = (60, 60, 60)
        active = (120, 0, 200)
        border = (255, 0, 255)
        text_color = (255, 255, 255)

        # Shadow
        cv2.rectangle(img, (x + 4, y + 4), (x + w + 4, y + h + 4), shadow, cv2.FILLED)
        # Button face
        face_color = active if pressed else normal
        cv2.rectangle(img, (x, y), (x + w, y + h), face_color, cv2.FILLED)
        # Border
        cv2.rectangle(img, (x, y), (x + w, y + h), border, 2)
        # Text
        font_scale = 1.2 if len(self.text) == 1 else 0.9
        cv2.putText(img, self.text, (x + 25, y + 60),
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, text_color, 2)
        return img

    def hit(self, x, y):
        bx, by = self.pos
        bw, bh = self.size
        return bx < x < bx + bw and by < y < by + bh

# -----------------------
# Layout
# -----------------------
button_values = [
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
    ['C']
]

buttons = []
for i, row in enumerate(button_values):
    for j, val in enumerate(row):
        buttons.append(Button((100 * j + 50, 100 * i + 50), val))

equation = ""

# Debounce / visual feedback
click_delay = 0              # frames to wait before next click is allowed
pressed_button = None        # which button is currently highlighted
pressed_feedback_frames = 0  # how long to show it as pressed

# -----------------------
# Camera
# -----------------------
cap = cv2.VideoCapture(0)

while True:
    ok, frame = cap.read()
    if not ok:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    lm_list = []
    if result.multi_hand_landmarks:
        for hand_lms in result.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand_lms, mp_hands.HAND_CONNECTIONS)
            h, w, _ = frame.shape
            for idx, lm in enumerate(hand_lms.landmark):
                lm_list.append([idx, int(lm.x * w), int(lm.y * h)])

    # Draw all buttons (highlight the last pressed for a few frames)
    for b in buttons:
        is_pressed = (pressed_button is b and pressed_feedback_frames > 0)
        frame = b.draw(frame, pressed=is_pressed)

    # Gesture -> click
    if lm_list:
        x1, y1 = lm_list[8][1], lm_list[8][2]   # index tip
        x2, y2 = lm_list[4][1], lm_list[4][2]   # thumb tip
        dist = np.hypot(x2 - x1, y2 - y1)

        if dist < 35 and click_delay == 0:  # pinch detected
            for b in buttons:
                if b.hit(x1, y1):
                    if b.text == '=':
                        try:
                            equation = str(eval(equation))
                        except Exception:
                            equation = "Error"
                    elif b.text == 'C':
                        equation = ""
                    else:
                        equation += b.text

                    pressed_button = b
                    pressed_feedback_frames = 6  # ~6 frames of highlight
                    click_delay = 10             # debounce ~10 frames
                    break

    # countdowns
    if click_delay > 0:
        click_delay -= 1
    if pressed_feedback_frames > 0:
        pressed_feedback_frames -= 1
    else:
        pressed_button = None

    # Display panel
    cv2.rectangle(frame, (50, 480), (450, 560), (25, 25, 25), cv2.FILLED)
    cv2.putText(frame, equation[-16:], (60, 540),  # show last 16 chars
                cv2.FONT_HERSHEY_SIMPLEX, 1.8, (255, 255, 255), 3)

    cv2.imshow("Gesture Calculator", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
