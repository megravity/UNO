const RoomPasswordModal = ({ show, setShow, setPasswordCorrect, password }) => {
    if (!show) {
        return null;
    }
    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (e.target.roomPassword.value === password) {
            setPasswordCorrect(true);
        } else {
            alert("wrong password");
        }
    };
    return (
        <div>
            <button onClick={() => setShow(false)}>X</button>
            <h2>Please enter the room password</h2>
            <form onSubmit={handlePasswordSubmit}>
                <input
                    type="text"
                    name="roomPassword"
                    id="roomPassword"
                    placeholder="password..."
                />
                <button>Join</button>
            </form>
        </div>
    );
};
export default RoomPasswordModal;
