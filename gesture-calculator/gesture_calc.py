import sys
from PyQt6.QtWidgets import QApplication, QWidget, QGridLayout, QPushButton, QLineEdit, QVBoxLayout
from PyQt6.QtCore import Qt

class Calculator(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Gesture Calculator")
        self.setFixedSize(300, 400)
        self.setStyleSheet("background-color: #121212;")

        # Layout
        main_layout = QVBoxLayout()
        self.display = QLineEdit()
        self.display.setAlignment(Qt.AlignmentFlag.AlignRight)
        self.display.setFixedHeight(50)
        self.display.setStyleSheet("font-size: 24px; color: white; background-color: #1f1f1f; border: none; padding: 10px;")
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

    def on_button_click(self):
        sender = self.sender().text()
        if sender == "C":
            self.display.clear()
        elif sender == "=":
            try:
                self.display.setText(str(eval(self.display.text())))
            except:
                self.display.setText("Error")
        else:
            self.display.setText(self.display.text() + sender)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    calc = Calculator()
    calc.show()
    sys.exit(app.exec())
