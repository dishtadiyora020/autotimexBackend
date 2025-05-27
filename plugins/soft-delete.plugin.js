import mongoose from "mongoose";

const softDeletePlugin = (schema) => {
    schema.add({
        deleted_at: {
            type: Date,
            default: null,
        }
    });

    schema.virtual('is_deleted').get(function () {
        return this.deleted_at !== null;
    });

    schema.statics.softDelete = function (filter) {
        return this.updateMany(
            filter,
            { deleted_at: new Date() }
        );
    };

    schema.statics.findByIdAndDelete = async function (id, options = {}) {
        if (options.hard_delete === true) {
            return this.findByIdAndDelete(id, { ...options, hard_delete: undefined });
        }

        return this.findByIdAndUpdate(
            id,
            { deleted_at: new Date() },
            {
                new: true,
                ...options
            }
        );
    };

    schema.statics.aggregate = function (pipeline = []) {
        const finalPipeline = [
            {
                $match: {
                    deleted_at: null
                }
            },
            ...pipeline
        ];

        return mongoose.Model.aggregate.call(this, finalPipeline);
    };

    schema.statics.deleteMany = function (filter, session) {
        return this.updateMany(
            filter,
            { deleted_at: new Date() },
            ...(session ? [{ session: session.session }] : [])
        );
    };

    schema.statics.softDeleteById = function (_id) {
        return this.updateOne(
            { _id: new mongoose.Types.ObjectId(_id) },
            { deleted_at: new Date() }
        );
    };

    schema.statics.restore = function (filter) {
        return this.updateMany(
            filter,
            { deleted_at: null }
        );
    };

    const includeDeletedSymbol = Symbol('includeDeleted');

    schema.query.withDeleted = function () {
        this[includeDeletedSymbol] = true;
        return this.where({ $or: [{ deleted_at: null }, { deleted_at: { $ne: null } }] });
    };

    schema.query.onlyDeleted = function () {
        this[includeDeletedSymbol] = true;
        return this.where({ deleted_at: { $ne: null } });
    };

    schema.query.onlyActive = function () {
        return this.where({ deleted_at: null });
    };

    schema.methods.softDelete = function () {
        this.deleted_at = new Date();
        return this.save();
    };

    schema.methods.restore = function () {
        this.deleted_at = null;
        return this.save();
    };

    schema.pre(['find', 'findOne', 'countDocuments'], function () {
        if (this[includeDeletedSymbol]) {
            return;
        }

        const conditions = this.getQuery();

        if (conditions.deleted_at !== undefined) {
            return;
        }

        if (conditions.$or?.some(condition => condition.deleted_at !== undefined)) {
            return;
        }

        this.where({ deleted_at: null });
    });
};

export default softDeletePlugin;
