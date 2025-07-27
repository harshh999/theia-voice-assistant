import cv2
import mediapipe as mp
import pyautogui

# Initialize MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)
screen_w, screen_h = pyautogui.size()  # Get your screen size

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb_frame)

    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            h, w, c = frame.shape
            index_finger = hand_landmarks.landmark[8]  # Index fingertip
            thumb = hand_landmarks.landmark[4]         # Thumb tip

            x = int(index_finger.x * screen_w)
            y = int(index_finger.y * screen_h)

            # Pinch detection
            pinch_dist = ((index_finger.x - thumb.x)**2 + (index_finger.y - thumb.y)**2) ** 0.5

            if pinch_dist < 0.05:  # Pinch detected
                pyautogui.click(x, y)

    cv2.imshow("Gesture Control", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
