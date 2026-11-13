const { ObjectId } = require("mongodb");

class ContactService {
    constructor(client) {
        this.Contact = client.db().collection("contacts");
    }

    // Trích xuất dữ liệu hợp lệ từ payload
    extractContactData(payload) {
        const contact = {
            name: payload.name,
            email: payload.email,
            address: payload.address,
            phone: payload.phone,
            favorite: payload.favorite,
        };

        // Loại bỏ các trường undefined
        Object.keys(contact).forEach(
            (key) => contact[key] === undefined && delete contact[key]
        );

        return contact;
    }

    // 1. Tạo contact mới
    async create(payload) {
        const contact = this.extractContactData(payload);
        const result = await this.Contact.findOneAndUpdate(
            contact,
            { $set: { favorite: contact.favorite === true } },
            { returnDocument: "after", upsert: true }
        );
        return result.value || result;
    }

    // 2. Tìm kiếm các contact
    async find(filter) {
        const cursor = await this.Contact.find(filter);
        return await cursor.toArray();
    }

    // 3. Tìm theo tên
    async findByName(name) {
        return await this.find({
            name: { $regex: new RegExp(name), $options: "i" },
        });
    }

  // 4. Tìm theo ID (Hỗ trợ cả số nguyên, chuỗi và ObjectId)
    async findById(id) {
        let queryId = id;
        // Nếu là chuỗi số (ví dụ "1"), chuyển nó về dạng số nguyên 1 để khớp với MongoDB
        if (!isNaN(id)) {
            queryId = Number(id);
        } else if (ObjectId.isValid(id)) {
            queryId = new ObjectId(id);
        }

        return await this.Contact.findOne({
            _id: queryId,
        });
    }
    // 5. Cập nhật theo ID
    async update(id, payload) {
        let queryId = !isNaN(id) ? Number(id) : (ObjectId.isValid(id) ? new ObjectId(id) : id);
        const filter = { _id: queryId };
        const update = this.extractContactData(payload);
        const result = await this.Contact.findOneAndUpdate(
            filter,
            { $set: update },
            { returnDocument: "after" }
        );
        return result.value || result;
    }

    async delete(id) {
        let queryId = !isNaN(id) ? Number(id) : (ObjectId.isValid(id) ? new ObjectId(id) : id);
        const result = await this.Contact.findOneAndDelete({
            _id: queryId,
        });
        return result.value || result;
    }

    // 7. Tìm danh sách yêu thích
    async findFavorite() {
        return await this.find({ favorite: true });
    }

    // 8. Xóa tất cả
    async deleteAll() {
        const result = await this.Contact.deleteMany({});
        return result.deletedCount;
    }
}

module.exports = ContactService;